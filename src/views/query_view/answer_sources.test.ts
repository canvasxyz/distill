import { describe, expect, it } from "vitest";
import type { QueryResult } from "./ai_utils";
import { getAnswerPosts, getAnswerScope } from "./answer_sources";

describe("saved answer scope", () => {
  const post = {
    id_str: "123",
    created_at: "2026-08-01T12:00:00Z",
    full_text: "A saved post.",
  };
  const result = {
    batchStatuses: {
      0: {
        status: "done",
        groundedTweets: { genuine: [post], hallucinated: ["missing"] },
      },
      1: {
        status: "done",
        groundedTweets: { genuine: [post], hallucinated: ["missing"] },
      },
      2: { status: "queued" },
    },
  } as unknown as QueryResult;
  it("uses saved, deduplicated posts rather than the current archive or filter state", () => {
    expect(getAnswerPosts(result)).toEqual({
      posts: [post],
      unavailable: ["missing"],
    });
    expect(getAnswerScope(result)).toMatch(/^1 post used · /);
  });
  it("does not invent scope for older answers with no saved posts", () => {
    expect(getAnswerScope({ batchStatuses: {} } as QueryResult)).toBe(
      "Post scope unavailable",
    );
  });
});
