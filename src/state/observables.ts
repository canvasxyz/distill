import { db } from "../db";

export const accountObservable = async () => {
  return db.accounts.toArray();
};

export const profileObservable = async () => {
  return db.profiles.toArray();
};

export const allTweetsObservable = async () => {
  return db.tweets.toArray();
};

export const queryResultsObservable = async () => {
  return await db.queryResults.toArray();
};
