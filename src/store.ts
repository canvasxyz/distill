import { create } from "zustand";
import type { Account, FilterMatch, Tweet } from "./types";
import { classificationLabels, getClassification } from "./filtering/openai";
import PQueue from "p-queue";
import { db } from "./db";
import { liveQuery, type Subscription } from "dexie";
import { createRef, type RefObject } from "react";
import {
  allTweetsObservable,
  excludedTweetsObservable,
  filterTweetsObservable,
  includedTweetsObservable,
} from "./observables";
import { filters } from "./filtering/filters";

const concurrency = 20;

type StoreTypes = {
  init: () => Promise<void>;
  subscriptions: RefObject<Subscription[]>;
  subscribe: () => void;
  unsubscribe: () => void;
  allTweets: Tweet[];
  includedTweets: Tweet[];
  excludedTweets: Tweet[];
  tweetsByFilterName: Record<string, Tweet[]>;
  filterMatchesByTweetId: Record<string, FilterMatch[]>;
  dbHasTweets: boolean;
  clearDatabase: () => Promise<void>;
  appIsReady: boolean;
  analyzeTweetState: number; // % completed analyzing tweets
  analyzeTweets: () => void;
  numTweetsAnalyzed: number;
  analysisInProgress: boolean;
  analysisQueue: PQueue;
  account: Account | null;
  setAccount: (account: Account) => Promise<void>;
  setTweets: (tweets: Tweet[]) => Promise<void>;
  excludedTweetIdsSet: Set<string>;
  addExcludedTweets: (tweetIdsToExclude: string[]) => void;
  removeExcludedTweets: (tweetIdsToInclude: string[]) => void;
};

const subscriptions = createRef<Subscription[]>() as RefObject<Subscription[]>;

export const useStore = create<StoreTypes>((set, get) => ({
  init: async () => {
    // before anything else is displayed we need to check that the database has tweets in it
    const dbHasTweets = (await db.tweets.limit(1).toArray()).length > 0;
    set({ dbHasTweets, appIsReady: true });
  },
  subscriptions,
  subscribe: () => {
    const { subscriptions } = get();

    const allTweetsSubscription = liveQuery(allTweetsObservable).subscribe({
      next: (newAllTweets) => set({ allTweets: newAllTweets }),
      error: (error) => console.error(error),
    });

    const includedTweetsSubscription = liveQuery(
      includedTweetsObservable
    ).subscribe({
      next: (newIncludedTweets) => set({ includedTweets: newIncludedTweets }),
      error: (error) => console.error(error),
    });

    const excludedTweetsSubscription = liveQuery(
      excludedTweetsObservable
    ).subscribe({
      next: (newExcludedTweets) =>
        set({
          excludedTweets: newExcludedTweets,
          excludedTweetIdsSet: new Set(
            newExcludedTweets.map((tweet) => tweet.id)
          ),
        }),
      error: (error) => console.error(error),
    });

    const filterTweetsSubscription = liveQuery(
      filterTweetsObservable
    ).subscribe({
      next: ({ tweetsByFilterName, filterMatchesByTweetId }) =>
        set({ tweetsByFilterName, filterMatchesByTweetId }),
      error: (error) => console.error(error),
    });

    subscriptions.current = [
      allTweetsSubscription,
      includedTweetsSubscription,
      excludedTweetsSubscription,
      filterTweetsSubscription,
    ];
  },
  unsubscribe: () => {
    const { subscriptions } = get();
    for (const subscription of subscriptions.current) {
      subscription.unsubscribe();
    }
    subscriptions.current = [];
  },
  allTweets: [],
  includedTweets: [],
  excludedTweets: [],
  tweetsByFilterName: {},
  filterMatchesByTweetId: {},
  dbHasTweets: false,
  clearDatabase: async () => {
    await db.delete();
    // refresh page
    location.reload();
  },

  appIsReady: false,
  analyzeTweetState: 0,
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
  account: null,
  setAccount: async (account) => {
    await db.accounts.clear();
    console.log(account);
    await db.accounts.add(account);

    set({ account });
  },
  setTweets: async (tweets: Tweet[]) => {
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
  excludedTweetIdsSet: new Set(),
  analysisQueue: new PQueue({ concurrency }),

  addExcludedTweets: async (tweetIdsToExclude) => {
    for (const tweetId of tweetIdsToExclude) {
      await db.excludedTweetIds.add({ id: tweetId }, tweetId);
    }
  },
  removeExcludedTweets: async (tweetIdsToInclude) => {
    for (const tweetId of tweetIdsToInclude) {
      await db.excludedTweetIds.delete(tweetId);
    }
  },
}));
