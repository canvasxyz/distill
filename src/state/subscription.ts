// state that is "synced" from indexeddb

import { liveQuery, type Subscription } from "dexie";
import { createRef, type RefObject } from "react";
import {
  accountObservable,
  profileObservable,
  allTweetsObservable,
  queryResultsObservable,
  sessionDataObservable,
  fullTextFuzzySetFieldsObservable,
} from "./observables";
import type { Account, ProfileWithId, Tweet } from "../types";
import type { QueryResult } from "../views/query_view/ai_utils";
import type { StateCreator } from "zustand";
import type { StoreSlices } from "./types";
import { deserialize } from "./fuzzyset/serialize.js";
import type { FuzzySetInstance } from "./fuzzyset/fuzzyset.js";

export type SubscriptionSlice = {
  subscriptions: RefObject<Subscription[]>;
  subscribe: () => void;
  unsubscribe: () => void;
  account: Account | null;
  profile: ProfileWithId | null;
  allTweets: Tweet[];
  tweetsByFullText: FuzzySetInstance | null;
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

    const profileSubscription = liveQuery(profileObservable).subscribe({
      next: (newProfile) => set({ profile: newProfile[0] || null }),
      error: (error) => console.error(error),
    });

    const allTweetsSubscription = liveQuery(allTweetsObservable).subscribe({
      next: (newAllTweets) => {
        set({ allTweets: newAllTweets });
      },
      error: (error) => console.error(error),
    });

    const queryResultsSubscription = liveQuery(
      queryResultsObservable,
    ).subscribe({
      next: (queryResults) => set({ queryResults }),
      error: (error) => console.error(error),
    });

    const sessionDataSubscription = liveQuery(sessionDataObservable).subscribe({
      next: (sessionData) =>
        set({
          viewingMyArchive: sessionData[0]
            ? sessionData[0].viewingMyArchive
            : false,
        }),
      error: (error) => console.error(error),
    });

    const fullTextFuzzySetFieldsSubscription = liveQuery(
      fullTextFuzzySetFieldsObservable,
    ).subscribe({
      next: (results) => {
        set({ tweetsByFullText: deserialize(JSON.parse(results[0].fields)) });
      },
      error: (error) => console.error(error),
    });

    subscriptions.current = [
      accountSubscription,
      profileSubscription,
      allTweetsSubscription,
      queryResultsSubscription,
      sessionDataSubscription,
      fullTextFuzzySetFieldsSubscription,
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
  profile: null,
  allTweets: [],
  tweetsByFullText: null,
  queryResults: [],
});
