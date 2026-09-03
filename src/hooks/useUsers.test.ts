import { describe, expect, it } from "vitest";
import { mergeCommunityArchiveAccounts, type CAAccount } from "./useUsers";

function account(accountId: string, username: string): CAAccount {
  return {
    accountId,
    username,
    numTweets: 0,
    numFollowers: 0,
    profile: {
      avatarMediaUrl: "",
    },
  };
}

describe("mergeCommunityArchiveAccounts", () => {
  it("puts starred users first in their configured order", () => {
    const result = mergeCommunityArchiveAccounts([
      account("popular", "popular-user"),
      account("repligate", "repligate"),
      account("exgenesis", "exgenesis"),
    ]);

    expect(result.map(({ accountId }) => accountId)).toEqual([
      "exgenesis",
      "repligate",
      "popular",
    ]);
  });

  it("preserves page order and removes accounts repeated across pages", () => {
    const firstPage = [account("one", "one"), account("two", "two")];
    const secondPage = [account("two", "two"), account("three", "three")];

    const result = mergeCommunityArchiveAccounts(firstPage, secondPage);

    expect(result.map(({ accountId }) => accountId)).toEqual([
      "one",
      "two",
      "three",
    ]);
  });
});
