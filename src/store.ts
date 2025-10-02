import { create } from "zustand";
import type { Account, Tweet } from "./types";
import { filters, type FilterMatch } from "./filtering/filters";
import { classificationLabels, getClassification } from "./filtering/openai";
import PQueue from "p-queue";

const concurrency = 20;

type StoreTypes = {
  analyzeTweetState: number; // % completed analyzing tweets
  analyzeTweets: () => void;
  numTweetsAnalyzed: number;
  analysisInProgress: boolean;
  analysisQueue: PQueue;
  account: Account | null;
  setAccount: (account: Account) => void;
  tweets: Tweet[] | null;
  setTweets: (tweets: Tweet[]) => void;
  labelsByTweetId: Record<string, { name: string; filterMatch: FilterMatch }[]>;
  tweetIdsByLabel: Record<string, string[]>;
  printLabels: () => void;
  setLabel: (tweet: Tweet, label: string) => void;
  excludedTweetIds: Record<string, boolean>;
  addExcludedTweets: (tweetIdsToExclude: string[]) => void;
  removeExcludedTweets: (tweetIdsToInclude: string[]) => void;
};

export const useStore = create<StoreTypes>((set, get) => ({
  analyzeTweetState: 0,
  analyzeTweets: () => {
    const { analysisQueue, tweets } = get();
    if (tweets === null) {
      // fail
      return;
    }

    set({ analysisInProgress: true });

    for (const tweet of tweets) {
      analysisQueue.add(async () => {
        const { setLabel } = get();
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
              setLabel(tweet, label.toLowerCase());
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
  account: null,
  setAccount: (account) => set({ account }),
  tweets: null,
  setTweets: (tweets: Tweet[]) => {
    const start = performance.now();
    // apply filters
    const labelsByTweetId: Record<
      string,
      { name: string; filterMatch: FilterMatch }[]
    > = {};
    const tweetIdsByLabel: Record<string, string[]> = {};
    for (const tweet of tweets || []) {
      for (const filter of filters) {
        const filterMatch = filter.evaluateFilter(tweet);
        if (filterMatch.filter) {
          labelsByTweetId[tweet.id] ||= [];
          labelsByTweetId[tweet.id].push({ name: filter.name, filterMatch });
          tweetIdsByLabel[filter.name] ||= [];
          tweetIdsByLabel[filter.name].push(tweet.id);
        }
      }
    }
    const end = performance.now();
    console.log(`Processing filters took ${end - start}ms`);
    set(() => ({
      tweets,
      labelsByTweetId,
      tweetIdsByLabel,
    }));
  },
  analysisQueue: new PQueue({ concurrency }),
  labelsByTweetId: {},
  tweetIdsByLabel: {},
  setLabel: (tweet, label) =>
    set(({ labelsByTweetId, tweetIdsByLabel }) => ({
      labelsByTweetId: {
        ...labelsByTweetId,
        [tweet.id]: [
          ...(labelsByTweetId[tweet.id] || []),
          { name: label, filterMatch: { filter: true, type: "llm" } },
        ],
      },
      tweetIdsByLabel: {
        ...tweetIdsByLabel,
        [label]: [...(tweetIdsByLabel[label] || []), tweet.id],
      },
    })),
  printLabels: () => {
    const { labelsByTweetId, tweetIdsByLabel } = get();
    console.log(labelsByTweetId);
    console.log(tweetIdsByLabel);
  },
  excludedTweetIds: {},
  addExcludedTweets: (tweetIdsToExclude) => {
    set(({ excludedTweetIds: oldExcludedTweets }) => {
      const newExcludedTweets = { ...oldExcludedTweets };
      for (const tweetId of tweetIdsToExclude) {
        newExcludedTweets[tweetId] = true;
      }

      return {
        excludedTweetIds: newExcludedTweets,
      };
    });
  },
  removeExcludedTweets: (tweetIdsToInclude) => {
    set(({ excludedTweetIds: oldExcludedTweets }) => {
      const newExcludedTweets = { ...oldExcludedTweets };
      for (const tweetId of tweetIdsToInclude) {
        delete newExcludedTweets[tweetId];
      }
      return {
        excludedTweetIds: newExcludedTweets,
      };
    });
  },
}));
