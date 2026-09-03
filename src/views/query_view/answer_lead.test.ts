import { describe, expect, it } from "vitest";
import { answerLead } from "./answer_lead";

describe("answer lead presentation", () => {
  it("wraps the existing heading and paragraph, leaving the rest and reference definitions untouched", () => {
    const heading = {
      type: "heading",
      depth: 2,
      children: [{ type: "text", value: "A practical dreamer." }],
    };
    const paragraph = {
      type: "paragraph",
      children: [
        {
          type: "linkReference",
          identifier: "tweet",
          children: [{ type: "text", value: "Source" }],
        },
      ],
    };
    const list = { type: "list", children: [{ type: "listItem" }] };
    const definition = {
      type: "definition",
      identifier: "tweet",
      url: "https://x.com/i/status/123",
    };
    const tree = { children: [heading, paragraph, list, definition] };
    answerLead("@example")()(tree);
    expect(tree.children.slice(1)).toEqual([list, definition]);
    expect(tree.children[0]).toMatchObject({
      data: { hName: "section" },
      children: [
        { children: [{ value: "@example" }] },
        heading,
        paragraph,
        {
          children: [
            { value: expect.stringContaining("A guess, not a verdict.") },
          ],
        },
      ],
    });
  });
  it("works with plain prose and does not invent a heading", () => {
    const first = {
      type: "paragraph",
      children: [{ type: "text", value: "An ordinary answer." }],
    };
    const second = {
      type: "paragraph",
      children: [{ type: "text", value: "More detail." }],
    };
    const tree = { children: [first, second] };
    answerLead()()(tree);
    expect(tree.children[0].children?.[1]).toBe(first);
    expect(tree.children[1]).toBe(second);
  });
  it("leaves list-first and empty answers unchanged", () => {
    const tree = { children: [{ type: "list", children: [] }] };
    const original = structuredClone(tree);
    answerLead()()(tree);
    expect(tree).toEqual(original);
    expect(() => answerLead()()({ children: [] })).not.toThrow();
  });
});
