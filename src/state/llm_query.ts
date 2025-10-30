import type { StateCreator } from "zustand";
import type { StoreSlices } from "./types";
import {
  batchSystemPrompt,
  extractTweetTexts,
  finalSystemPrompt,
  submitQuery,
  type QueryResult,
  type RangeSelection,
} from "../views/query_view/ai_utils";
import PQueue from "p-queue";
import type { Tweet } from "../types";
import { normalizeText, pickSampleNoRepeats } from "../utils";
import { v7 as uuidv7 } from "uuid";
import { db } from "../db";
import { QUERY_BATCH_SIZE, type LLMQueryConfig } from "../constants";

export const AVAILABLE_LLM_CONFIGS: LLMQueryConfig[] = [
  ["gpt-oss-120b", "cerebras", null],
  ["gpt-oss-120b", "fireworks", null],
  ["llama-3.3-70b", "cerebras", null],
  ["qwen-3-235b-a22b-instruct-2507", "cerebras", null],
  ["qwen-3-32b", "cerebras", null],
  ["google/gemini-2.0-flash-001", "deepinfra", null],
];

export type LlmQuerySlice = {
  queryResult: QueryResult | null;
  isProcessing: boolean;
  startedProcessingTime: number | null;
  currentRunningQuery: string | null;
  errorMessage: string | null;
  llmQueryQueue: PQueue;
  selectedConfigIndex: number;
  setSelectedConfigIndex: (idx: number) => void;
  getGenuineTweets: (tweetTexts: string[]) => {
    genuine: Tweet[];
    hallucinated: string[];
  };
  submit: (
    filteredTweetsToAnalyse: Tweet[],
    query: string,
    rangeSelection: RangeSelection,
  ) => void;
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
  currentRunningQuery: null,
  isProcessing: false,
  startedProcessingTime: null,
  errorMessage: null,
  llmQueryQueue,
  selectedConfigIndex: 0,
  setSelectedConfigIndex: (idx: number) => set({ selectedConfigIndex: idx }),

  getGenuineTweets: (tweetTexts: string[]) => {
    const { tweetsByNormalizedFullText, tweetsFullTextFuzzySet } = get();
    if (!tweetsFullTextFuzzySet || !tweetsByNormalizedFullText) {
      return { genuine: [], hallucinated: [] };
    }
    const genuine: Tweet[] = [];
    const hallucinated: string[] = [];

    for (const tweetText of tweetTexts) {
      // check if the tweet text is in the db
      const normalizedTweetText = normalizeText(tweetText);

      const threshold = 0.8;
      const candidates =
        tweetsFullTextFuzzySet.get(normalizedTweetText, undefined, threshold) ||
        [];

      if (candidates.length === 0) {
        // hallucination!
        hallucinated.push(normalizedTweetText);
      } else {
        const candidate = candidates[0];
        const matchingTweets = tweetsByNormalizedFullText[candidate[1]];
        const tweet = matchingTweets[0];

        genuine.push(tweet);
      }
    }

    return { genuine, hallucinated };
  },

  submit: async (filteredTweetsToAnalyse: Tweet[], query: string) => {
    const queuedTime = performance.now();
    const { account, getGenuineTweets, selectedConfigIndex, llmQueryQueue } =
      get();
    if (!account) {
      set({
        isProcessing: false,
        startedProcessingTime: null,
        currentRunningQuery: null,
        // keep errorMessage as-is; account is handled higher up in UI
      });
      return;
    }

    const config: LLMQueryConfig =
      AVAILABLE_LLM_CONFIGS[selectedConfigIndex] || AVAILABLE_LLM_CONFIGS[0];

    const [model, provider, openrouterProvider] = config;

    const initialSample = pickSampleNoRepeats(
      filteredTweetsToAnalyse,
      QUERY_BATCH_SIZE,
    );

    set({
      startedProcessingTime: queuedTime,
      currentRunningQuery: query,
      isProcessing: true,
      errorMessage: null,
    });

    // narrow down the initial sample
    const queryResult = await submitQuery({
      tweetsSample: initialSample,
      query: { systemPrompt: batchSystemPrompt, prompt: query },
      account,
      model,
      provider,
      openrouterProvider: openrouterProvider,
    });

    const tweetTexts = extractTweetTexts(queryResult.result);

    // for each tweet text, request similar tweets using the embedding API

    const tweetstoAugment = getGenuineTweets(tweetTexts).genuine;
    const collectedEntries: { full_text: string }[][] = [];

    for (const tweet of tweetstoAugment) {
      llmQueryQueue.add(async () => {
        try {
          const response = await fetch("http://localhost:8000/similar-tweets", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              tweet_id: tweet.id,
              account_id: account.accountId,
            }),
          });
          const jsonResponse = await response.json();
          collectedEntries.push(jsonResponse.results);
        } catch {
          collectedEntries.push([]);
          return;
        }

        if (collectedEntries.length === tweetstoAugment.length) {
          // done

          const collectedTweetTexts = collectedEntries
            .flat()
            .map((t) => t.full_text);

          const uniqueTweetTexts = [...new Set(collectedTweetTexts)].map(
            (t) => ({ full_text: t }),
          );

          const finalQueryResult = await submitQuery({
            tweetsSample: uniqueTweetTexts,
            query: { systemPrompt: finalSystemPrompt, prompt: query },
            account,
            model,
            provider,
            openrouterProvider: openrouterProvider,
          });
          // save finalQueryResult
          const queryId = uuidv7();
          const newQueryResult: QueryResult = {
            ...finalQueryResult,
            evidence: uniqueTweetTexts,
            id: queryId,
            totalRunTime: 0,
            rangeSelection: {
              type: "random-sample" as const,
              sampleSize: QUERY_BATCH_SIZE,
            },
            totalEstimatedCost: 0,
            totalTokens: 0,
            model,
            provider: openrouterProvider
              ? `${provider}-${openrouterProvider}`
              : provider,
          };

          db.queryResults.add(newQueryResult);

          set({
            queryResult: newQueryResult,
            isProcessing: false,
            currentRunningQuery: null,
            startedProcessingTime: null,
            errorMessage: null,
          });
        }
      });
    }
  },

  setQueryError: (msg: string | null) => set({ errorMessage: msg }),
});
