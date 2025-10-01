import { create } from "zustand";
import type { Account, Tweet } from "./types";
import { filters } from "./filters";
import PQueue from "p-queue";
import OpenAI from "openai";
import { classificationLabels, classifyTweet } from "./openai";

const concurrency = 5;
const openaiProviderUrl = "https://api.deepinfra.com/v1";

type StoreTypes = {
  openrouterKey: string | null;
  setOpenrouterKey: (key: string) => void;
  analyzeTweetState: number; // % completed analyzing tweets
  analyzeTweets: () => void;
  analysisQueue: PQueue;
  account: Account | null;
  setAccount: (account: Account) => void;
  tweets: Tweet[] | null;
  tweetsById: Record<string, Tweet>;
  setTweets: (tweets: Tweet[]) => void;
  labelsByTweetId: Record<string, string[]>;
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
  openrouterKey: null,
  setOpenrouterKey: (openrouterKey) => set({ openrouterKey }),
  analyzeTweetState: 0,
  analyzeTweets: () => {
    const { analysisQueue, openrouterKey, tweets } = get();
    if (!openrouterKey || tweets === null) {
      // fail
      return;
    }

    const client = new OpenAI({
      baseURL: openaiProviderUrl,
      apiKey: openrouterKey,
      dangerouslyAllowBrowser: true,
    });

    const model = "mistralai/Mistral-Small-3.2-24B-Instruct-2506";

    for (const tweet of tweets.slice(0, 100)) {
      analysisQueue.add(async () => {
        const { setLabel } = get();
        const result = await classifyTweet(client, tweet.full_text, model);
        console.log(result);

        if (result === null) {
          return;
        }
        for (const label of classificationLabels) {
          // set label
          if (result[label] > 0.5) {
            setLabel(tweet, label.toLowerCase());
          }
        }
      });
    }
    analysisQueue.on("idle", () => {
      console.log("done!");
    });
    // submit the current tweets to OpenRouter (or whatever inference provider)
    // actually using Deep Infra for now
  },
  account: null,
  setAccount: (account) => set({ account }),
  tweets: null,
  tweetsById: {},
  setTweets: (tweets: Tweet[]) => {
    const start = performance.now();
    // apply filters
    const labelsByTweetId: Record<string, string[]> = {};
    const tweetsByLabel: Record<string, Tweet[]> = {};
    const tweetsById: Record<string, Tweet> = {};
    for (const tweet of tweets || []) {
      tweetsById[tweet.id] = tweet;
      for (const filter of filters) {
        if (filter.shouldFilter(tweet)) {
          labelsByTweetId[tweet.id] ||= [];
          labelsByTweetId[tweet.id].push(filter.name);
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
        [tweet.id]: [...(labelsByTweetId[tweet.id] || []), label],
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
