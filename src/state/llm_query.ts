import type { StateCreator } from "zustand";
import type { StoreSlices } from "./types";
import {
  finalSystemPrompt,
  selectSubset,
  submitQuery,
  type BatchStatus,
  type QueryResult,
  type RangeSelection,
} from "../views/query_view/ai_utils";
import PQueue from "p-queue";
import type { Account, Tweet } from "../types";
import { v7 as uuidv7 } from "uuid";
import { db } from "../db";
import { formatTweetCitations } from "../utils";
import {
  DEFAULT_QUERY_BATCH_SIZE as DEFAULT_BATCH,
  GEMINI_FLASH_QUERY_BATCH_SIZE as GEMINI_BATCH,
  getBatchSizeForConfig,
  type PromptPlacement,
  type LLMQueryConfig,
} from "../constants";

export const AVAILABLE_LLM_CONFIGS: LLMQueryConfig[] = [
  [
    "google/gemini-3-flash-preview",
    "openrouter",
    "google-vertex",
    true,
    GEMINI_BATCH,
  ],
  ["gpt-oss-120b", "groq", null, false, DEFAULT_BATCH],
  ["gpt-oss-120b", "cerebras", null, false, DEFAULT_BATCH],
  ["qwen-3-235b-a22b-instruct-2507", "cerebras", null, false, DEFAULT_BATCH],
  ["google/gemini-2.0-flash-001", "deepinfra", null, false, DEFAULT_BATCH],
];

export const getGenuineTweetIds = <T extends { id_str: string; id: string }>(
  tweetIdsToCheck: string[],
  originalTweets: T[],
) => {
  const tweetsById: Record<string, T> = {};
  for (const tweet of originalTweets) {
    tweetsById[tweet.id_str || tweet.id] = tweet;
  }

  const genuine: T[] = [];
  const hallucinated: string[] = [];

  for (const id of tweetIdsToCheck) {
    const t = tweetsById[id];
    if (t) {
      genuine.push(t);
    } else {
      hallucinated.push(id);
    }
  }

  return { genuine, hallucinated };
};

export type LlmQuerySlice = {
  queryResult: QueryResult | null;
  isProcessing: boolean;
  startedProcessingTime: number | null;
  currentRunningQuery: string | null;
  batchStatuses: Record<string, BatchStatus>;
  errorMessage: string | null;
  llmQueryQueue: PQueue;
  selectedConfigIndex: number;
  setSelectedConfigIndex: (idx: number) => void;
  submit: (
    filteredTweetsToAnalyse: Tweet[],
    account: Account,
    query: string,
    rangeSelection: RangeSelection,
    promptPlacement: PromptPlacement,
  ) => void;
  updateBatchStatus: (batchId: number, status: BatchStatus) => void;
  setQueryError: (msg: string | null) => void;
};

const concurrency = 5;
const llmQueryQueue = new PQueue({ concurrency });

export const createLlmQuerySlice: StateCreator<
  StoreSlices,
  [],
  [],
  LlmQuerySlice
> = (set, get) => ({
  queryResult: null,
  batchStatuses: {},
  currentRunningQuery: null,
  isProcessing: false,
  startedProcessingTime: null,
  errorMessage: null,
  llmQueryQueue,
  selectedConfigIndex: 0,
  setSelectedConfigIndex: (idx: number) => set({ selectedConfigIndex: idx }),

  submit: (
    filteredTweetsToAnalyse: Tweet[],
    account: Account,
    query: string,
    rangeSelection,
    promptPlacement,
  ) => {
    const queryId = uuidv7();

    const filteredTweetsSubsetToAnalyse = selectSubset(
      filteredTweetsToAnalyse,
      rangeSelection,
    );

    const { selectedConfigIndex } = get();
    const config: LLMQueryConfig =
      AVAILABLE_LLM_CONFIGS[selectedConfigIndex] || AVAILABLE_LLM_CONFIGS[0];

    const [model, provider, openrouterProvider] = config;

    const queryBatchSize = getBatchSizeForConfig(config);
    const tweetsForQuery = filteredTweetsSubsetToAnalyse.slice(
      Math.max(0, filteredTweetsSubsetToAnalyse.length - queryBatchSize),
    );
    const batches = tweetsForQuery.length ? [tweetsForQuery] : [];

    const queuedTime = performance.now();
    set({
      batchStatuses: Object.fromEntries(
        batches.map((_tweets, idx) => [idx, { status: "queued" as const }]),
      ),
      startedProcessingTime: queuedTime,
      currentRunningQuery: query,
      isProcessing: true,
      errorMessage: null,
    });

    const { llmQueryQueue, updateBatchStatus } = get();

    // If there is no account or no tweets, reset view state and exit early
    if (!account || batches.length === 0) {
      set({
        isProcessing: false,
        startedProcessingTime: null,
        currentRunningQuery: null,
        batchStatuses: {},
        errorMessage:
          batches.length === 0 ? "No tweets available to query." : null,
        // keep errorMessage as-is when account is missing; account is handled higher up in UI
      });
      return;
    }

    const batchId = 0;
    const batch = batches[batchId];

    llmQueryQueue.add(async () => {
      try {
        const startTime = performance.now();

        updateBatchStatus(batchId, {
          status: "pending",
          startTime,
        });

        let attempts = 3;
        let queryResult: Awaited<ReturnType<typeof submitQuery>> | null = null;
        let queryError: unknown;

        while (attempts > 0 && queryResult === null) {
          try {
            queryResult = await submitQuery({
              tweetsSample: batch,
              query: {
                systemPrompt: finalSystemPrompt,
                prompt: query,
                promptPlacement,
              },
              account,
              model,
              provider,
              openrouterProvider: openrouterProvider,
            });
          } catch (e) {
            queryError = e;
            attempts--;
          }
        }

        if (!queryResult) {
          throw new Error(
            `Query failed after 3 attempts. Error from model provider (${provider}): "${queryError}"`,
          );
        }

        const groundedTweets = { genuine: batch, hallucinated: [] as string[] };

        const endTime = performance.now();
        const formattedResult = formatTweetCitations(queryResult.result);

        updateBatchStatus(batchId, {
          status: "done",
          groundedTweets,
          outputText: formattedResult,
          startTime,
          endTime,
          runTime: endTime - startTime,
          usage: queryResult.usage,
          provider: queryResult.provider,
          model: queryResult.model,
        });

        const {
          batchStatuses,
          isProcessing: stillProcessing,
          currentRunningQuery,
        } = get();
        if (!stillProcessing || currentRunningQuery !== query) return;

        const finalTime = performance.now();
        const totalRunTime = finalTime - queuedTime!;

        const totalEstimatedCost =
          (queryResult.usage as { estimated_cost?: number }).estimated_cost ||
          0;
        const totalTokens = queryResult.usage.total_tokens;

        const newQueryResult = {
          ...queryResult,
          result: formattedResult,
          id: queryId,
          totalRunTime,
          rangeSelection,
          batchStatuses,
          totalEstimatedCost,
          totalTokens,
          model,
          provider: openrouterProvider
            ? `${provider}-${openrouterProvider}`
            : provider,
          queriedHandle: `@${account.username}`,
        };

        db.queryResults.add(newQueryResult);

        set({
          queryResult: newQueryResult,
          isProcessing: false,
          batchStatuses: {},
          currentRunningQuery: null,
          startedProcessingTime: null,
          errorMessage: null,
        });
      } catch (error) {
        console.error("LLM query failed:", error);
        try {
          // Clear any pending tasks in the queue to stop further processing
          get().llmQueryQueue.clear();
        } catch {
          // ignore queue clear errors
        }
        // Reset UI-related state so the button and view recover
        set({
          isProcessing: false,
          startedProcessingTime: null,
          currentRunningQuery: null,
          batchStatuses: {},
          errorMessage:
            (error as Error)?.message || "Query failed. Please try again.",
        });
      }
    });
  },

  updateBatchStatus: (batchId: number, newBatchStatus: BatchStatus) => {
    const { batchStatuses, isProcessing } = get();
    // Ignore updates if processing has been cancelled/reset
    if (!isProcessing) return;
    set((state) => ({
      ...state,
      batchStatuses: { ...batchStatuses, [batchId]: newBatchStatus },
    }));
  },
  setQueryError: (msg: string | null) => set({ errorMessage: msg }),
});
