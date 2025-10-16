import type { StateCreator } from "zustand";
import type { StoreSlices } from "./types";
import {
  batchSystemPrompt,
  extractTweetTexts,
  finalSystemPrompt,
  submitQuery,
  type QueryResult,
  type RangeSelectionType,
} from "../views/query_view/ai_utils";
import PQueue from "p-queue";
import type { Tweet } from "../types";
import { getBatches, pickSampleNoRepeats } from "../utils";
import { v7 as uuidv7 } from "uuid";
import { db } from "../db";

export type BatchStatus =
  | {
      status: "done";
      startTime: number;
      endTime: number;
      runTime: number;
      result: string[];
    }
  | { status: "pending"; startTime: number }
  | { status: "queued" };

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

    let tweetsToAnalyse: Tweet[];
    if (rangeSelectionType === "whole-archive") {
      tweetsToAnalyse = filteredTweetsToAnalyse;
    } else if (rangeSelectionType === "date-range") {
      const startDateTime = new Date(startDate);
      const endDateTime = new Date(endDate);
      endDateTime.setMonth(endDateTime.getMonth() + 1); // Include the entire end month

      tweetsToAnalyse = filteredTweetsToAnalyse.filter((tweet) => {
        // tweet.created_at
        const tweetDate = new Date(tweet.created_at);
        return tweetDate >= startDateTime && tweetDate < endDateTime;
      });
    } else {
      const sampleSize = 1000;
      // random sample
      tweetsToAnalyse = pickSampleNoRepeats(
        filteredTweetsToAnalyse,
        sampleSize
      );
    }

    const batchSize = 1000;
    const batches = getBatches(tweetsToAnalyse, batchSize);

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

        const queryResult = await submitQuery(
          batch,
          { systemPrompt: batchSystemPrompt, prompt: query },
          account
        );

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

        const allTweetTexts = Object.values(
          batchStatuses as unknown as { result: string }[]
        )
          .map((batchStatus) => batchStatus.result)
          .flat();

        // submit query to create the final result based on the collected texts
        const result = await submitQuery(
          allTweetTexts.map((tweetText) => ({ full_text: tweetText })),
          { systemPrompt: finalSystemPrompt, prompt: query },
          account
        );
        const finalTime = performance.now();
        const totalRunTime = finalTime - queuedTime!;

        const newQueryResult = {
          ...result,
          id: queryId,
          totalRunTime,
          rangeSelectionType,
          startDate,
          endDate,
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
