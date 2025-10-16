import PQueue from "p-queue";
import type { StoreSlices } from "./types";
import { classificationLabels, getClassification } from "../filtering/openai";
import type { StateCreator } from "zustand";

const concurrency = 40;

export type AnalysisSlice = {
  analyzeTweets: () => void;
  numTweetsAnalyzed: number;
  analysisInProgress: boolean;
  analysisQueue: PQueue;
};

export const createAnalysisSlice: StateCreator<
  StoreSlices,
  [],
  [],
  AnalysisSlice
> = (set, get) => ({
  analyzeTweets: async () => {
    const { analysisQueue } = get();
    const tweets = await db.tweets.toArray();

    set({ analysisInProgress: true });

    for (const tweet of tweets) {
      analysisQueue.add(async () => {
        try {
          const mistralClassification = await getClassification(
            tweet.full_text,
            "mistralai/Mistral-Small-3.2-24B-Instruct-2506"
          );

          const qwenClassification = await getClassification(
            tweet.full_text,
            "Qwen/Qwen3-30B-A3B"
          );

          for (const label of classificationLabels) {
            // set label
            if (
              mistralClassification[label] > 0.5 &&
              qwenClassification[label] > 0.5
            ) {
              await db.filterTweetIds.add({
                id: tweet.id,
                filterName: label.toLowerCase(),
                type: "llm",
              });
            }
          }
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (e) {
          // TODO: handle error?
        } finally {
          set(({ numTweetsAnalyzed }) => ({
            numTweetsAnalyzed: numTweetsAnalyzed + 1,
          }));
        }
      });
    }
    analysisQueue.on("idle", () => {
      set({ numTweetsAnalyzed: 0, analysisInProgress: false });
    });
    // submit the current tweets to OpenRouter (or whatever inference provider)
    // actually using Deep Infra for now
  },
  numTweetsAnalyzed: 0,
  analysisInProgress: false,
  analysisQueue: new PQueue({ concurrency }),
});
