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
  // Get all loaded accounts
  const allAccounts = await db.accounts.toArray();
  if (allAccounts.length === 0) {
    return [];
  }

  const allResults = await db.queryResults.toArray();

  // Create a set of account IDs and usernames for efficient lookup
  const accountIds = new Set(allAccounts.map((acc) => acc.accountId));
  const accountUsernames = new Set(
    allAccounts.map((acc) => `@${acc.username}`.toLowerCase()),
  );

  // Filter results that match any loaded account:
  // - queriedAccountIds includes any loaded account ID, OR
  // - queriedHandle matches any loaded account username (for backward compatibility)
  return allResults.filter((result) => {
    // Check if queriedAccountIds includes any loaded account
    if (result.queriedAccountIds && result.queriedAccountIds.length > 0) {
      return result.queriedAccountIds.some((id) => accountIds.has(id));
    }
    // Fall back to queriedHandle for backward compatibility
    if (result.queriedHandle) {
      return accountUsernames.has(result.queriedHandle.toLowerCase());
    }
    return false;
  });
};
