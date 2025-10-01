import { create } from "zustand";
import type { Account, Tweet } from "./types";
import { filters, type FilterMatch } from "./filters";
import PQueue from "p-queue";

import { classificationLabels, getClassification } from "./openai";

const concurrency = 10;

type StoreTypes = {
  analyzeTweetState: number; // % completed analyzing tweets
  analyzeTweets: () => void;
  numTweetsAnalyzed: number;
  analysisInProgress: boolean;
  analysisQueue: PQueue;
  account: Account | null;
  setAccount: (account: Account) => void;
  tweets: Tweet[] | null;
  tweetsById: Record<string, Tweet>;
  setTweets: (tweets: Tweet[]) => void;
  labelsByTweetId: Record<string, { name: string; filterMatch: FilterMatch }[]>;
  tweetsByLabel: Record<string, Tweet[]>;
  printLabels: () => void;
  setLabel: (tweet: Tweet, label: string) => void;
  excludedTweetIds: Record<string, boolean>;
  excludedTweets: Tweet[] | null;
  includedTweets: Tweet[] | null;
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

    for (const tweet of tweets.slice(0, 1000)) {
      analysisQueue.add(async () => {
        const { setLabel } = get();
        try {
          const classification = await getClassification(tweet.full_text);

          for (const label of classificationLabels) {
            // set label
            if (classification[label] > 0.5) {
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
  tweetsById: {},
  setTweets: (tweets: Tweet[]) => {
    const start = performance.now();
    // apply filters
    const labelsByTweetId: Record<
      string,
      { name: string; filterMatch: FilterMatch }[]
    > = {};
    const tweetsByLabel: Record<string, Tweet[]> = {};
    const tweetsById: Record<string, Tweet> = {};
    for (const tweet of tweets || []) {
      tweetsById[tweet.id] = tweet;
      for (const filter of filters) {
        const filterMatch = filter.evaluateFilter(tweet);
        if (filterMatch.filter) {
          labelsByTweetId[tweet.id] ||= [];
          labelsByTweetId[tweet.id].push({ name: filter.name, filterMatch });
          tweetsByLabel[filter.name] ||= [];
          tweetsByLabel[filter.name].push(tweet);
        }
      }
    }
    const end = performance.now();
    console.log(`Processing filters took ${end - start}ms`);
    set(() => ({
      tweets,
      excludedTweets: [],
      includedTweets: tweets,
      tweetsById,
      labelsByTweetId,
      tweetsByLabel,
    }));
  },
  analysisQueue: new PQueue({ concurrency }),
  labelsByTweetId: {},
  tweetsByLabel: {},
  setLabel: (tweet, label) =>
    set(({ labelsByTweetId, tweetsByLabel }) => ({
      labelsByTweetId: {
        ...labelsByTweetId,
        [tweet.id]: [
          ...(labelsByTweetId[tweet.id] || []),
          { name: label, filterMatch: { filter: true, type: "llm" } },
        ],
      },
      tweetsByLabel: {
        ...tweetsByLabel,
        [label]: [...(tweetsByLabel[label] || []), tweet],
      },
    })),
  printLabels: () => {
    const { labelsByTweetId, tweetsByLabel } = get();
    console.log(labelsByTweetId);
    console.log(tweetsByLabel);
  },
  excludedTweetIds: {},
  excludedTweets: null,
  includedTweets: null,
  addExcludedTweets: (tweetIdsToExclude) => {
    set(({ excludedTweetIds: oldExcludedTweets }) => {
      const newExcludedTweets = { ...oldExcludedTweets };
      for (const tweetId of tweetIdsToExclude) {
        newExcludedTweets[tweetId] = true;
      }

      const tweets = get().tweets || [];
      return {
        excludedTweetIds: newExcludedTweets,
        includedTweets: tweets.filter((tweet) => !newExcludedTweets[tweet.id]),
        excludedTweets: tweets.filter((tweet) => newExcludedTweets[tweet.id]),
      };
    });
  },
  removeExcludedTweets: (tweetIdsToInclude) => {
    set(({ excludedTweetIds: oldExcludedTweets }) => {
      const newExcludedTweets = { ...oldExcludedTweets };
      for (const tweetId of tweetIdsToInclude) {
        delete newExcludedTweets[tweetId];
      }
      const tweets = get().tweets || [];
      return {
        excludedTweetIds: newExcludedTweets,
        includedTweets: tweets.filter((tweet) => !newExcludedTweets[tweet.id]),
        excludedTweets: tweets.filter((tweet) => newExcludedTweets[tweet.id]),
      };
    });
  },
}));
