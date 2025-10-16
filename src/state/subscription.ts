// state that is "synced" from indexeddb

import { liveQuery, type Subscription } from "dexie";
import { createRef, type RefObject } from "react";
import {
  accountObservable,
  allTweetsObservable,
  excludedTweetsObservable,
  filterTweetsObservable,
  includedTweetsObservable,
  queryResultsObservable,
} from "./observables";
import type { Account, FilterMatch, Tweet } from "../types";
import type { QueryResult } from "../views/query_view/ai_utils";
import type { StateCreator } from "zustand";
import type { StoreSlices } from "./types";

export type SubscriptionSlice = {
  subscriptions: RefObject<Subscription[]>;
  subscribe: () => void;
  unsubscribe: () => void;
  account: Account | null;
  allTweets: Tweet[];
  includedTweets: Tweet[];
  excludedTweets: Tweet[];
  excludedTweetIdsSet: Set<string>;
  tweetsByFilterName: Record<string, Tweet[]>;
  filterMatchesByTweetId: Record<string, FilterMatch[]>;
  queryResults: QueryResult[];
};

const subscriptions = createRef<Subscription[]>() as RefObject<Subscription[]>;

export const createSubscriptionSlice: StateCreator<
  StoreSlices,
  [],
  [],
  SubscriptionSlice
> = (set, get) => ({
  subscriptions,
  subscribe: () => {
    const { subscriptions } = get();

    const accountSubscription = liveQuery(accountObservable).subscribe({
      next: (newAccount) => set({ account: newAccount[0] || null }),
      error: (error) => console.error(error),
    });

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

    const queryResultsSubscription = liveQuery(
      queryResultsObservable
    ).subscribe({
      next: (queryResults) => set({ queryResults }),
      error: (error) => console.error(error),
    });

    subscriptions.current = [
      accountSubscription,
      allTweetsSubscription,
      includedTweetsSubscription,
      excludedTweetsSubscription,
      filterTweetsSubscription,
      queryResultsSubscription,
    ];
  },
  unsubscribe: () => {
    const { subscriptions } = get();
    for (const subscription of subscriptions.current) {
      subscription.unsubscribe();
    }
    subscriptions.current = [];
  },
  account: null,
  allTweets: [],
  includedTweets: [],
  excludedTweets: [],
  excludedTweetIdsSet: new Set(),
  tweetsByFilterName: {},
  filterMatchesByTweetId: {},
  queryResults: [],
});
