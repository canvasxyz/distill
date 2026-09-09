import { describe, expect, it } from "vitest";
import { answerLead } from "./answer_lead";

describe("answer lead presentation", () => {
  it("wraps the whole answer, keeping blocks and reference definitions in order", () => {
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
    expect(tree.children).toHaveLength(1);
    expect(tree.children[0]).toMatchObject({
      data: { hName: "section" },
      children: [
        { children: [{ value: "@example" }] },
        heading,
        paragraph,
        list,
        definition,
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
    expect(tree.children).toHaveLength(1);
    expect(tree.children[0].children?.[1]).toBe(first);
    expect(tree.children[0].children?.[2]).toBe(second);
  });
  it("wraps list-first answers and leaves empty answers unchanged", () => {
    const list = { type: "list", children: [] };
    const tree = { children: [list] };
    answerLead()()(tree);
    expect(tree.children).toHaveLength(1);
    expect(tree.children[0].children?.[1]).toBe(list);
    const empty = { children: [] };
    answerLead()()(empty);
    expect(empty.children).toEqual([]);
  });
});
