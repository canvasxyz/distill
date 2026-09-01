import { describe, expect, it } from "vitest";
import {
  COMMUNITY_ARCHIVE_PAGE_SIZE,
  loadAllCommunityArchiveAccounts,
  type CAAccount,
} from "./useUsers";

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

describe("loadAllCommunityArchiveAccounts", () => {
  it("loads users beyond Supabase's first page, including maebichka", async () => {
    const expected = Array.from(
      { length: COMMUNITY_ARCHIVE_PAGE_SIZE + 1 },
      (_, index) =>
        account(
          String(index),
          index === COMMUNITY_ARCHIVE_PAGE_SIZE ? "maebichka" : `user-${index}`,
        ),
    );
    const requestedRanges: Array<[number, number]> = [];

    const result = await loadAllCommunityArchiveAccounts(
      async (from, to) => {
        requestedRanges.push([from, to]);
        return expected.slice(from, to + 1);
      },
      COMMUNITY_ARCHIVE_PAGE_SIZE,
      1,
    );

    expect(requestedRanges).toEqual([
      [0, 999],
      [1000, 1999],
    ]);
    expect(result).toHaveLength(1001);
    expect(result?.some(({ username }) => username === "maebichka")).toBe(true);
  });
});
