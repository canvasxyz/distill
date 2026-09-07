import { describe, expect, it } from "vitest";
import { formatTweetCitations } from "./utils";

// Shapes below were all seen in real answers from Nemotron, Gemini 3 Flash and
// Gemini 2.0 Flash for the same prompt.
const A = "2095946515697336559";
const B = "2095947779009110159";
const C = "2093434448901763123";
const url = (id: string) => `https://x.com/i/status/${id}`;
const cite = (n: number, id: string) => `[${n}](${url(id)})`;

describe("formatTweetCitations", () => {
  it("numbers the requested [id](url) form in reading order, reusing numbers", () => {
    expect(
      formatTweetCitations(
        `Walks [${A}](${url(A)}) and tools [${B}](${url(B)}), again [${A}](${url(A)}).`,
      ),
    ).toBe(`Walks ${cite(1, A)} and tools ${cite(2, B)}, again ${cite(1, A)}.`);
  });
  it("flattens parenthesised groups of links or bare ids", () => {
    expect(
      formatTweetCitations(
        `data ([${A}](${url(A)}), [${B}](${url(B)})). More (${C}).`,
      ),
    ).toBe(`data ${cite(1, A)} ${cite(2, B)}. More ${cite(3, C)}.`);
    expect(formatTweetCitations(`agents [${A}, ${B}]. Also [${C}].`)).toBe(
      `agents ${cite(1, A)} ${cite(2, B)}. Also ${cite(3, C)}.`,
    );
  });
  it("keeps descriptive link text and adds the citation after it", () => {
    expect(
      formatTweetCitations(
        `the project's [daily digest](${url(A)}), its [gallery](${url(B)})`,
      ),
    ).toBe(
      `the project's daily digest ${cite(1, A)}, its gallery ${cite(2, B)}`,
    );
  });
  it("links bare status URLs, including ones wrapped in 【】, <> or brackets", () => {
    expect(
      formatTweetCitations(
        `principles【${url(A)}】. **Tweet:** ${url(B)} – quote. See <https://twitter.com/someone/status/${C}?s=20>.`,
      ),
    ).toBe(
      `principles ${cite(1, A)}. **Tweet:** ${cite(2, B)} – quote. See ${cite(3, C)}.`,
    );
  });
  it("survives a stray bracket inside the URL", () => {
    expect(formatTweetCitations(`("love locally" [${A}](${url(A)}]))`)).toBe(
      `("love locally" ${cite(1, A)})`,
    );
  });
  it("links ids loose in prose, in backticks, and echoed prompt tags", () => {
    expect(
      formatTweetCitations(
        `endorsement, etc., in ${A}), and \`${B}\` plus [Post id="${C}", Post id='${A}'].`,
      ),
    ).toBe(
      `endorsement, etc., in ${cite(1, A)}), and ${cite(2, B)} plus ${cite(3, C)} ${cite(1, A)}.`,
    );
  });
  it("leaves short numbers, years and ordinary links alone", () => {
    const text =
      "In 2024 they posted 12 times [1] and linked [docs](https://example.com/2024).";
    expect(formatTweetCitations(text)).toBe(text);
  });
  it("is idempotent", () => {
    const once = formatTweetCitations(
      `A [${A}](${url(A)}) then (${B}, ${C}) and [note](${url(A)}) and ${url(B)}.`,
    );
    expect(formatTweetCitations(once)).toBe(once);
  });
});
