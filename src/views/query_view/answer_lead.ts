// Wrap the whole answer in the lead section, without rewriting its content or
// splitting Markdown strings (which would break lists and reference links).
// The opening heading and paragraph get their display treatment from CSS.
type Node = {
  type: string;
  children?: Node[];
  value?: string;
  data?: { hName?: string; hProperties?: { className: string } };
};

export function answerLead(person?: string) {
  return () => (tree: { children: Node[] }) => {
    if (!tree.children.length) return;
    const body = tree.children.splice(0);
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
        ...body,
      ],
    });
  };
}
