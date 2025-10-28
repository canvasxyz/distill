import { db } from "../db";

export const accountObservable = () => db.accounts.toArray();
export const profileObservable = () => db.profiles.toArray();

export const allTweetsObservable = () => db.tweets.toArray();

export const queryResultsObservable = async () =>
  await db.queryResults.toArray();

export const sessionDataObservable = async () => await db.sessionData.toArray();
