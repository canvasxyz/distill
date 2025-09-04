import { create } from "zustand";
import type { Tweet } from "./types";

type StoreTypes = {
  tweets: Tweet[] | null;
  setTweets: (tweets: Tweet[]) => void;
};

export const useStore = create<StoreTypes>((set) => ({
  tweets: null,
  setTweets: (tweets: Tweet[]) =>
    set(() => ({
      tweets,
    })),
}));
