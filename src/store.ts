import { create } from "zustand";
import type { Tweet } from "./types";
import { filters } from "./filters";

type StoreTypes = {
  tweets: Tweet[] | null;
  tweetsById: Record<string, Tweet>;
  setTweets: (tweets: Tweet[]) => void;
  labelsByTweetId: Record<string, string[]>;
  tweetIdsByLabel: Record<string, string[]>;
  excludedTweets: Record<string, boolean>;
  addExcludedTweets: (tweetIdsToExclude: string[]) => void;
  removeExcludedTweets: (tweetIdsToInclude: string[]) => void;
};

export const useStore = create<StoreTypes>((set) => ({
  tweets: null,
  tweetsById: {},
  setTweets: (tweets: Tweet[]) => {
    const start = performance.now();
    // apply filters
    const labelsByTweetId: Record<string, string[]> = {};
    const tweetIdsByLabel: Record<string, string[]> = {};
    const tweetsById: Record<string, Tweet> = {};
    for (const tweet of tweets || []) {
      tweetsById[tweet.id] = tweet;
      for (const filter of filters) {
        if (filter.shouldFilter(tweet)) {
          labelsByTweetId[tweet.id] ||= [];
          labelsByTweetId[tweet.id].push(filter.name);
          tweetIdsByLabel[filter.name] ||= [];
          tweetIdsByLabel[filter.name].push(tweet.id);
        }
      }
    }
    const end = performance.now();
    console.log(`Processing filters took ${end - start}ms`);
    set(() => ({
      tweets,
      tweetsById,
      labelsByTweetId,
      tweetIdsByLabel,
    }));
  },
  labelsByTweetId: {},
  tweetIdsByLabel: {},
  excludedTweets: {},
  addExcludedTweets: (tweetIdsToExclude) => {
    set(({ excludedTweets: oldExcludedTweets }) => {
      const newExcludedTweets = { ...oldExcludedTweets };
      for (const tweetId of tweetIdsToExclude) {
        newExcludedTweets[tweetId] = true;
      }
      return { excludedTweets: newExcludedTweets };
    });
  },
  removeExcludedTweets: (tweetIdsToInclude) => {
    set(({ excludedTweets: oldExcludedTweets }) => {
      const newExcludedTweets = { ...oldExcludedTweets };
      for (const tweetId of tweetIdsToInclude) {
        delete newExcludedTweets[tweetId];
      }
      return { excludedTweets: newExcludedTweets };
    });
  },
}));
