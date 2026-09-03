// Wrap the answer's existing opening blocks, without rewriting its content or
// splitting Markdown strings (which would break lists and reference links).
type Node = {
  type: string;
  children?: Node[];
  value?: string;
  data?: { hName?: string; hProperties?: { className: string } };
};

export function answerLead(person?: string) {
  return () => (tree: { children: Node[] }) => {
    const first = tree.children[0];
    if (!first || !["heading", "paragraph"].includes(first.type)) return;
    const count =
      first.type === "heading" && tree.children[1]?.type === "paragraph"
        ? 2
        : 1;
    const lead = tree.children.splice(0, count);
    const label = (text: string, className: string): Node => ({
      type: "paragraph",
      children: [{ type: "text", value: text }],
      data: { hProperties: { className } },
    });
    tree.children.unshift({
      type: "blockquote",
      data: { hName: "section", hProperties: { className: "answer-lead" } },
      children: [
        label(person || "An impression", "answer-lead-person"),
        ...lead,
        label(
          "A guess, not a verdict. Made from tweets, not the whole person.",
          "answer-lead-caveat",
        ),
      ],
    });
  };
}
