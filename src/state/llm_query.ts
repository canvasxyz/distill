import type { StateCreator } from "zustand";
import type { StoreSlices } from "./types";
import {
  batchSystemPrompt,
  finalSystemPrompt,
  selectSubset,
  submitQuery,
  type BatchStatus,
  type QueryResult,
  type RangeSelection,
} from "../views/query_view/ai_utils";
import PQueue from "p-queue";
import type { Account, Tweet } from "../types";
import { getBatches } from "../utils";
import { v7 as uuidv7 } from "uuid";
import { db } from "../db";
import {
  DEFAULT_QUERY_BATCH_SIZE,
  GEMINI_FLASH_QUERY_BATCH_SIZE,
  getBatchSizeForConfig,
  type LLMQueryConfig,
} from "../constants";

export const AVAILABLE_LLM_CONFIGS: LLMQueryConfig[] = [
  ["gpt-oss-120b", "cerebras", null, true, DEFAULT_QUERY_BATCH_SIZE],
  ["llama-3.3-70b", "cerebras", null, true, DEFAULT_QUERY_BATCH_SIZE],
  [
    "google/gemini-2.0-flash-001",
    "deepinfra",
    null,
    true,
    DEFAULT_QUERY_BATCH_SIZE,
  ],
  [
    "qwen-3-235b-a22b-instruct-2507",
    "cerebras",
    null,
    false,
    DEFAULT_QUERY_BATCH_SIZE,
  ],
  ["qwen-3-32b", "cerebras", null, false, DEFAULT_QUERY_BATCH_SIZE],
  ["gpt-oss-120b", "fireworks", null, false, DEFAULT_QUERY_BATCH_SIZE],
  ["gpt-oss-120b", "groq", null, false, DEFAULT_QUERY_BATCH_SIZE],
  [
    "openai/gpt-oss-120b",
    "openrouter",
    "cerebras",
    false,
    DEFAULT_QUERY_BATCH_SIZE,
  ],
  [
    "openai/gpt-oss-120b",
    "openrouter",
    "baseten",
    false,
    DEFAULT_QUERY_BATCH_SIZE,
  ],
  [
    "openai/gpt-oss-120b",
    "openrouter",
    "groq",
    false,
    DEFAULT_QUERY_BATCH_SIZE,
  ],
  [
    "openai/gpt-oss-120b",
    "openrouter",
    "sambanova",
    false,
    DEFAULT_QUERY_BATCH_SIZE,
  ],
  [
    "google/gemini-3-flash-preview",
    "openrouter",
    "google-vertex",
    false,
    GEMINI_FLASH_QUERY_BATCH_SIZE,
  ],
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

    const batches = getBatches(
      filteredTweetsSubsetToAnalyse,
      getBatchSizeForConfig(config),
    );

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

    // If there is no account, reset view state and exit early
    if (!account) {
      set({
        isProcessing: false,
        startedProcessingTime: null,
        currentRunningQuery: null,
        batchStatuses: {},
        // keep errorMessage as-is; account is handled higher up in UI
      });
      return;
    }

    for (let i = 0; i < batches.length; i++) {
      const batchId = i;
      const batch = batches[batchId];

      llmQueryQueue.add(async () => {
        try {
          const startTime = performance.now();

          updateBatchStatus(i, {
            status: "pending",
            startTime,
          });

          let attempts = 3;
          let queryResult: Awaited<ReturnType<typeof submitQuery>> | null =
            null;
          let queryError: unknown;

          while (attempts > 0 && queryResult === null) {
            try {
              queryResult = await submitQuery({
                tweetsSample: batch,
                query: { systemPrompt: batchSystemPrompt, prompt: query },
                account,
                model,
                provider,
                openrouterProvider: openrouterProvider,
                isBatchRequest: true,
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

          const tweetIds = JSON.parse(queryResult.result).ids;
          const groundedTweets = getGenuineTweetIds(tweetIds, batch);

          const endTime = performance.now();
          updateBatchStatus(i, {
            status: "done",
            groundedTweets,
            outputText: queryResult.result,
            startTime,
            endTime,
            runTime: endTime - startTime,
            usage: queryResult.usage,
            provider: queryResult.provider,
            model: queryResult.model,
          });

          // if the job is done, then trigger the final query
          const {
            batchStatuses,
            isProcessing: stillProcessing,
            currentRunningQuery,
          } = get();
          // If processing has been cancelled/reset, do not proceed to final query
          if (!stillProcessing || currentRunningQuery !== query) return;
          for (const batchStatus of Object.values(batchStatuses)) {
            if (batchStatus.status !== "done") return;
          }

          const collectedTweets: Tweet[] = [];
          for (const batchStatus of Object.values(batchStatuses)) {
            if (batchStatus.status === "done") {
              for (const tweet of Object.values(
                batchStatus.groundedTweets.genuine,
              )) {
                if (tweet) collectedTweets.push(tweet);
              }
            }
          }

          let finalQueryAttempts = 3;
          let finalQueryResult: Awaited<ReturnType<typeof submitQuery>> | null =
            null;
          let finalQueryError: unknown;

          while (finalQueryAttempts > 0 && finalQueryResult === null) {
            try {
              // submit query to create the final result based on the collected texts
              finalQueryResult = await submitQuery({
                tweetsSample: collectedTweets,
                query: { systemPrompt: finalSystemPrompt, prompt: query },
                account,
                model,
                provider,
                openrouterProvider: openrouterProvider,
              });
            } catch (e) {
              console.log(e);
              console.log("retrying...");
              finalQueryError = e;
              finalQueryAttempts--;
            }
          }

          if (!finalQueryResult) {
            throw new Error(
              `Query failed after 3 attempts. Error from model provider (${provider}): "${finalQueryError}"`,
            );
          }

          const finalTime = performance.now();
          const totalRunTime = finalTime - queuedTime!;

          // collect the "usage" field from all of the batches

          let totalEstimatedCost = 0;
          let totalTokens = 0;
          for (const batchStatus of Object.values(batchStatuses)) {
            if (batchStatus.status === "done") {
              totalEstimatedCost += batchStatus.usage.estimated_cost || 0;
              totalTokens += batchStatus.usage.total_tokens;
            }
          }

          totalEstimatedCost +=
            (finalQueryResult.usage as { estimated_cost?: number })
              .estimated_cost || 0;
          totalTokens += finalQueryResult.usage.total_tokens;

          const newQueryResult = {
            ...finalQueryResult,
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
    }
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
