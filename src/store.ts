import { create } from "zustand";
import type { Tweet } from "./types";

type StoreTypes = {
  tweets: Tweet[] | null;
  setTweets: (tweets: Tweet[]) => void;
  excludedTweets: Record<string, boolean>;
  addExcludedTweets: (tweetIdsToExclude: string[]) => void;
  removeExcludedTweets: (tweetIdsToInclude: string[]) => void;
};

export const useStore = create<StoreTypes>((set) => ({
  tweets: null,
  setTweets: (tweets: Tweet[]) =>
    set(() => ({
      tweets,
    })),
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
