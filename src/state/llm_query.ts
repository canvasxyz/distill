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
  type RangeSelectionType,
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
  llmQueryQueue: PQueue;
  submit: (
    filteredTweetsToAnalyse: Tweet[],
    query: string,
    rangeSelectionType: RangeSelectionType,
    rangeArgs: { startDate: string; endDate: string }
  ) => void;
  updateBatchStatus: (batchId: number, status: BatchStatus) => void;
};

const concurrency = 30;
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
  llmQueryQueue,

  submit: (
    filteredTweetsToAnalyse: Tweet[],
    query: string,
    rangeSelectionType,
    { startDate, endDate }
  ) => {
    const queryId = uuidv7();

    const filteredTweetsSubsetToAnalyse = selectSubset(
      filteredTweetsToAnalyse,
      rangeSelectionType,
      {
        startDate,
        endDate,
      }
    );

    const batches = getBatches(filteredTweetsSubsetToAnalyse, QUERY_BATCH_SIZE);

    const queuedTime = performance.now();
    set({
      batchStatuses: Object.fromEntries(
        batches.map((_tweets, idx) => [idx, { status: "queued" as const }])
      ),
      startedProcessingTime: queuedTime,
      currentRunningQuery: query,
      isProcessing: true,
    });

    const { llmQueryQueue, account, updateBatchStatus } = get();

    if (!account) return;

    for (let i = 0; i < batches.length; i++) {
      const batchId = i;
      const batch = batches[batchId];

      llmQueryQueue.add(async () => {
        const startTime = performance.now();

        updateBatchStatus(i, {
          status: "pending",
          startTime,
        });

        let retries = 3;
        let queryResult: Awaited<ReturnType<typeof submitQuery>> | null = null;

        while (retries > 0 && queryResult === null) {
          try {
            queryResult = await submitQuery(
              batch,
              { systemPrompt: batchSystemPrompt, prompt: query },
              account
            );
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
          startTime,
          endTime,
          runTime: endTime - startTime,
        });

        // if the job is done, then trigger the final query
        const { batchStatuses } = get();
        for (const batchStatus of Object.values(batchStatuses)) {
          if (batchStatus.status !== "done") return;
        }

        const collectedTweetTexts = Object.values(
          batchStatuses as unknown as { result: string }[]
        )
          .map((batchStatus) => batchStatus.result)
          .flat()
          .map((tweetText) => ({ full_text: tweetText }));

        console.log(
          `submitting final query with ${collectedTweetTexts.length} tweets`
        );

        let finalQueryRetries = 3;
        let finalQueryResult: Awaited<ReturnType<typeof submitQuery>> | null =
          null;

        while (finalQueryRetries > 0 && finalQueryResult === null) {
          try {
            // submit query to create the final result based on the collected texts
            finalQueryResult = await submitQuery(
              collectedTweetTexts,
              { systemPrompt: finalSystemPrompt, prompt: query },
              account
            );
          } catch (e) {
            console.log(e);
            console.log("retrying...");
            finalQueryRetries--;
          }
        }

        if (!finalQueryResult) {
          throw new Error(
            `Final query failed after ${finalQueryRetries} retries!`
          );
        }

        const finalTime = performance.now();
        const totalRunTime = finalTime - queuedTime!;

        const newQueryResult = {
          ...finalQueryResult,
          id: queryId,
          totalRunTime,
          rangeSelectionType,
          startDate,
          endDate,
          batchStatuses,
        };

        db.queryResults.add(newQueryResult);

        set({
          queryResult: newQueryResult,
          isProcessing: false,
          batchStatuses: {},
          currentRunningQuery: null,
          startedProcessingTime: null,
        });
      });
    }
  },

  updateBatchStatus: (batchId: number, newBatchStatus: BatchStatus) => {
    const { batchStatuses } = get();
    set((state) => ({
      ...state,
      batchStatuses: { ...batchStatuses, [batchId]: newBatchStatus },
    }));
  },
});
