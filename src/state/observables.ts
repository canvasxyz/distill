import { db } from "../db";

export const accountObservable = async () => {
  return db.accounts.toArray();
};

export const profileObservable = async () => {
  const sessionData = await db.sessionData.toArray();
  const activeAccountId = sessionData[0]?.activeAccountId ?? null;
  if (activeAccountId === null) {
    return [];
  }
  return db.profiles.where("accountId").equals(activeAccountId).toArray();
};

export const allTweetsObservable = async () => {
  const sessionData = await db.sessionData.toArray();
  const activeAccountId = sessionData[0]?.activeAccountId ?? null;
  if (activeAccountId === null) {
    return [];
  }
  return db.tweets.where("account_id").equals(activeAccountId).toArray();
};

export const queryResultsObservable = async () => {
  return await db.queryResults.toArray();
};

export const sessionDataObservable = async () => await db.sessionData.toArray();
