import type { StateCreator } from "zustand";
import type { StoreSlices } from "./types";
import { filters } from "../filtering/filters";
import { processTwitterArchive } from "../processTwitterArchive";
import { db } from "../db";

export type InitSlice = {
  init: () => Promise<void>;
  dbHasTweets: boolean;
  clearDatabase: () => Promise<void>;
  appIsReady: boolean;
  ingestTwitterArchive: (file: File) => Promise<void>;
};

export const createInitSlice: StateCreator<StoreSlices, [], [], InitSlice> = (
  set
) => ({
  init: async () => {
    // before anything else is displayed we need to check that the database has tweets in it
    const dbHasTweets = (await db.tweets.limit(1).toArray()).length > 0;
    set({ dbHasTweets, appIsReady: true });
  },

  dbHasTweets: false,
  clearDatabase: async () => {
    await db.delete();
    // refresh page
    location.reload();
  },

  appIsReady: false,
  ingestTwitterArchive: async (file: File) => {
    const { account, profile, tweets } = await processTwitterArchive(file);

    await db.profiles.clear();
    await db.profiles.add(profile);
    // TODO: add following
    // TODO: add follower

    await db.accounts.clear();
    await db.accounts.add(account);

    await db.tweets.clear();
    await db.tweets.bulkAdd(tweets);

    // apply filters
    const filterMatchesToAdd = [];
    for (const tweet of tweets || []) {
      for (const filter of filters) {
        const filterMatch = filter.evaluateFilter(tweet);

        if (filterMatch) {
          filterMatchesToAdd.push(filterMatch);
        }
      }
    }
    await db.filterTweetIds.bulkAdd(filterMatchesToAdd);

    set(() => ({
      dbHasTweets: true,
    }));
  },
});
