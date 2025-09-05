import { create } from "zustand";
import type { Account, Tweet } from "./types";
import { filters } from "./filters";

type StoreTypes = {
  openrouterKey: string | null;
  setOpenrouterKey: (key: string) => void;
  account: Account | null;
  setAccount: (account: Account) => void;
  tweets: Tweet[] | null;
  tweetsById: Record<string, Tweet>;
  setTweets: (tweets: Tweet[]) => void;
  labelsByTweetId: Record<string, string[]>;
  tweetsByLabel: Record<string, Tweet[]>;
  excludedTweetIds: Record<string, boolean>;
  excludedTweets: Tweet[] | null;
  includedTweets: Tweet[] | null;
  addExcludedTweets: (tweetIdsToExclude: string[]) => void;
  removeExcludedTweets: (tweetIdsToInclude: string[]) => void;
};

export const useStore = create<StoreTypes>((set, get) => ({
  openrouterKey: null,
  setOpenrouterKey: (openrouterKey) => set({ openrouterKey }),

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
  labelsByTweetId: {},
  tweetsByLabel: {},
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
