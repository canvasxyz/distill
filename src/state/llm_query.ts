import type { StateCreator } from "zustand";
import type { StoreSlices } from "./types";
import {
  batchSystemPrompt,
  extractTweetTexts,
  finalSystemPrompt,
  selectSubset,
  submitQuery,
  type BatchStatus,
  type QueryResult,
  type RangeSelection,
} from "../views/query_view/ai_utils";
import PQueue from "p-queue";
import type { Tweet } from "../types";
import { getBatches } from "../utils";
import { v7 as uuidv7 } from "uuid";
import { db } from "../db";
import { QUERY_BATCH_SIZE } from "../constants";

export type LlmQuerySlice = {
  queryResult: QueryResult | null;
  isProcessing: boolean;
  startedProcessingTime: number | null;
  currentRunningQuery: string | null;
  batchStatuses: Record<string, BatchStatus>;
  errorMessage: string | null;
  llmQueryQueue: PQueue;
  submit: (
    filteredTweetsToAnalyse: Tweet[],
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

  submit: (filteredTweetsToAnalyse: Tweet[], query: string, rangeSelection) => {
    const queryId = uuidv7();

    const filteredTweetsSubsetToAnalyse = selectSubset(
      filteredTweetsToAnalyse,
      rangeSelection,
    );

    // gpt-oss-120b is the lowest cost and fastest Cerebras model.
    // Rate limits around 500 tweets/sec, or one query/10 sec.
    //
    // $0.35/mtok = $0.012/query
    // 65-131k context window
    // 1m TPM, 1k RPM, no daily limit

    // Need to implement:
    // - Login and auth
    // - Per user cooldown every 10 sec
    // - Routing to multiple models (llama-3.3-70b, gpt-oss-120b, qwen-3-235b-a22b-instruct-2507)
    //   gets us to one query/3 sec

    // concurrency = 5
    const config = ["gpt-oss-120b", "cerebras", null]; // fast - 10 seconds for 10k
    // const config = ["llama-3.3-70b", "cerebras", null]; // fast - 10 seconds for 10k
    // const config = ["qwen-3-235b-a22b-instruct-2507", "cerebras", null]; // slow - 20 seconds for 10k
    // const config = ["qwen-3-32b", "cerebras", null]; // slow - 15 seconds for 10k

    // concurrency = 5
    // const config = ["google/gemini-2.0-flash-001", "deepinfra", null]; // slow - 15-30 seconds for 10k
    // const config = ["openai/gpt-oss-120b", "deepinfra", null]; // mxfp4, slowest - 30-60 seconds for 10k
    // const config = ["Qwen/Qwen3-Next-80B-A3B-Instruct", "deepinfra", null]; // bfloat16, slowest - 30+ seconds for 10k

    // concurrency = 5
    // const config = [
    //   "google/gemini-2.5-flash-lite",
    //   "openrouter",
    //   "google-vertex",
    // ]; // did not finish
    // const config = [
    //   "google/gemini-2.5-flash-lite-preview-09-2025",
    //   "openrouter",
    //   "google-vertex/global",
    // ]; // slow - 30-60 seconds for 10k
    // const config = [
    //   "google/gemini-2.5-flash-preview-09-2025",
    //   "openrouter",
    //   "google-vertex/global",
    // ]; // slow - 30-60 seconds for 10k

    const [model, provider, oprProvider] = config;

    const batches = getBatches(filteredTweetsSubsetToAnalyse, QUERY_BATCH_SIZE);

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

    const { llmQueryQueue, account, updateBatchStatus } = get();

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

          let retries = 3;
          let queryResult: Awaited<ReturnType<typeof submitQuery>> | null =
            null;

          while (retries > 0 && queryResult === null) {
            try {
              queryResult = await submitQuery({
                tweetsSample: batch,
                query: { systemPrompt: batchSystemPrompt, prompt: query },
                account,
                model,
                provider,
                oprProvider,
              });
            } catch (e) {
              console.log(e);
              console.log("retrying...");
              retries--;
            }
          }

          if (!queryResult) {
            throw new Error(`Query failed after ${retries} retries!`);
          }

          const tweetTexts = extractTweetTexts(queryResult.result);

          const endTime = performance.now();
          updateBatchStatus(i, {
            status: "done",
            result: tweetTexts,
            outputText: queryResult.result,
            startTime,
            endTime,
            runTime: endTime - startTime,
            usage: queryResult.usage,
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

          const collectedTweetTexts = Object.values(
            batchStatuses as unknown as { result: string }[],
          )
            .map((batchStatus) => batchStatus.result)
            .flat()
            .map((tweetText) => ({ full_text: tweetText }));

          console.log(
            `submitting final query with ${collectedTweetTexts.length} tweets`,
          );

          let finalQueryRetries = 3;
          let finalQueryResult: Awaited<ReturnType<typeof submitQuery>> | null =
            null;

          while (finalQueryRetries > 0 && finalQueryResult === null) {
            try {
              // submit query to create the final result based on the collected texts
              finalQueryResult = await submitQuery({
                tweetsSample: collectedTweetTexts,
                query: { systemPrompt: finalSystemPrompt, prompt: query },
                account,
                model,
                provider,
                oprProvider,
              });
            } catch (e) {
              console.log(e);
              console.log("retrying...");
              finalQueryRetries--;
            }
          }

          if (!finalQueryResult) {
            throw new Error(
              `Final query failed after ${finalQueryRetries} retries!`,
            );
          }

          const finalTime = performance.now();
          const totalRunTime = finalTime - queuedTime!;

          // collect the "usage" field from all of the batches

          let totalEstimatedCost = 0;
          let totalTokens = 0;
          for (const batchStatus of Object.values(batchStatuses)) {
            if (batchStatus.status === "done") {
              totalEstimatedCost += batchStatus.usage.estimated_cost;
              totalTokens += batchStatus.usage.total_tokens;
            }
          }

          totalEstimatedCost += finalQueryResult.usage.estimated_cost;
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
            provider: oprProvider ? `${provider}-${oprProvider}` : provider,
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
          } catch (e) {
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
