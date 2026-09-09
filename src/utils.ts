export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export const sumNumbers = (values: number[]) =>
  values.reduce((v1, v2) => v1 + v2, 0);

export const pickSampleNoRepeats = <T>(inputList: T[], n: number) => {
  const inputListCopy = [...inputList];
  const output: T[] = [];
  while (output.length < n && inputListCopy.length > 0) {
    const randomIndex = Math.floor(Math.random() * inputListCopy.length);
    const [selectedTweet] = inputListCopy.splice(randomIndex, 1);
    output.push(selectedTweet);
  }
  return output;
};

export function getBatches<T>(tweetsToAnalyse: T[], batchSize: number) {
  let offset = 0;

  const batches = [];
  let batch: T[];
  do {
    batch = tweetsToAnalyse.slice(offset, offset + batchSize);

    batches.push(batch);

    offset += batchSize;
  } while (batch.length === batchSize);

  return batches;
}

export const snakeToCamelCase = (s: string) =>
  s.replace(/_([a-z])/g, (_match, letter) => letter.toUpperCase());

export const mapKeysDeep = (obj: Json, fn: (key: string) => string): Json =>
  Array.isArray(obj)
    ? obj.map((item) => mapKeysDeep(item, fn))
    : obj && typeof obj === "object"
      ? Object.fromEntries(
          Object.entries(obj).map(([k, v]) => [fn(k), mapKeysDeep(v!, fn)]),
        )
      : obj;

export const stripThink = (text: string) =>
  text.replace(/<think>[\s\S]*?<\/think>/gi, "");

export const formatCompactNumber = (n: number) => {
  try {
    const s = new Intl.NumberFormat("en", {
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(n);
    return s.replace("K", "k").replace("M", "m").replace("G", "g");
  } catch {
    if (n >= 1_000_000) return `${Math.round(n / 1_000_000)}m`;
    if (n >= 1_000) return `${Math.round(n / 1_000)}k`;
    return String(n);
  }
};

export const TWEET_STATUS_URL_REGEX =
  /^https?:\/\/(?:x|twitter)\.com\/(?:(?:[^/\s]+|i(?:\/web)?)\/status)\/\d+(?:\?[^\s)]+)?$/i;
const DEFAULT_TWEET_STATUS_URL = "https://x.com/i/status/";

export const extractTweetIdFromUrl = (url: string) => {
  const match = url.match(/status\/(\d+)/i);
  return match ? match[1] : null;
};

// Tweet ids are Twitter snowflakes: long runs of digits. Shorter numbers in an
// answer (years, counts, footnote markers) are left alone.
const TWEET_ID = "\\d{12,}";
// A status URL as models write it: x.com or twitter.com, any handle or the
// "i" shorthand, optional query string. The id is the first capture group.
const STATUS_URL =
  "https?:\\/\\/(?:www\\.)?(?:x|twitter)\\.com\\/(?:[^\\s/()\\[\\]]+\\/|i\\/(?:web\\/)?)status\\/(\\d+)(?:\\?[^\\s)\\]】>]*)?";

// Placeholder for a citation whose number is assigned once every pattern
// has been recognised, so numbers follow reading order.
const MARK = "\u0000";
const mark = (tweetId: string) => `${MARK}${tweetId}${MARK}`;
const MARK_REGEX = new RegExp(`${MARK}(\\d+)${MARK}`, "g");
const MARK_GROUP = `${MARK}\\d+${MARK}`;

/**
 * Rewrites every way a model refers to a tweet into a numbered Markdown
 * citation, `[n](https://x.com/i/status/<id>)`, numbered in order of first
 * appearance. The renderer turns those into hover-preview pills.
 *
 * Recognised, from real model output:
 * - `[<id>](<status url>)`, the requested form, alone or in a parenthesised
 *   group; `[daily digest](<status url>)` keeps its text and gains a citation
 * - a bare status URL, also inside 【】, <>, [] or ()
 * - `<Post id="<id>">` echoes of the prompt
 * - `[<id>, <id>]`, `(<id>, <id>)`, `` `<id>` `` and ids loose in prose
 *
 * Running it on its own output changes nothing, so it can be applied when an
 * answer is saved and again when an older answer is rendered.
 */
export const formatTweetCitations = (text: string) => {
  const urlLink = new RegExp(
    `\\[([^\\]]*)\\]\\(\\s*${STATUS_URL}[^)]*\\)`,
    "gi",
  );
  let out = text.replace(urlLink, (_match, label: string, tweetId: string) => {
    const trimmed = label.trim();
    return /^\d*$/.test(trimmed)
      ? mark(tweetId)
      : `${trimmed} ${mark(tweetId)}`;
  });

  const postId = new RegExp(
    `Post\\s+id\\s*=\\s*["'\u2018\u2019\u201c\u201d]?(${TWEET_ID})["'\u2018\u2019\u201c\u201d]?`,
    "gi",
  );
  out = out.replace(postId, (_match, tweetId: string) => mark(tweetId));

  const wrappedUrl = new RegExp(
    `[【<\\[(]\\s*${STATUS_URL}\\s*[】>\\])]`,
    "gi",
  );
  out = out.replace(wrappedUrl, (_match, tweetId: string) => mark(tweetId));
  const bareUrl = new RegExp(STATUS_URL, "gi");
  out = out.replace(bareUrl, (_match, tweetId: string) => mark(tweetId));

  const idGroup = new RegExp(
    `[\\[(【]\\s*(${TWEET_ID}(?:\\s*,\\s*${TWEET_ID})*)\\s*[\\])】]`,
    "g",
  );
  out = out.replace(idGroup, (_match, ids: string) =>
    ids
      .split(",")
      .map((id) => mark(id.trim()))
      .join(" "),
  );

  const codeId = new RegExp(`\`\\s*(${TWEET_ID})\\s*\``, "g");
  out = out.replace(codeId, (_match, tweetId: string) => mark(tweetId));

  const looseId = new RegExp(
    `(?<![\\w/=${MARK}])(${TWEET_ID})(?![\\w${MARK}])`,
    "g",
  );
  out = out.replace(looseId, (_match, tweetId: string) => mark(tweetId));

  // Brackets or parentheses that now hold nothing but citations are noise.
  const wrappedMarks = new RegExp(
    `[\\[(]\\s*(${MARK_GROUP}(?:\\s*[,;]?\\s*${MARK_GROUP})*)\\s*[\\])]`,
    "g",
  );
  out = out.replace(wrappedMarks, (_match, marks: string) =>
    marks.replace(/\s*[,;]\s*|\s+/g, " ").trim(),
  );
  const markRun = new RegExp(
    `${MARK_GROUP}(?:\\s*[,;]\\s*${MARK_GROUP})+`,
    "g",
  );
  out = out.replace(markRun, (run) => run.replace(/\s*[,;]\s*/g, " "));

  // A citation glued to the preceding word reads badly once it is a pill.
  out = out.replace(
    new RegExp(`([\\w"'\u2019\u201d])(?=${MARK}\\d)`, "g"),
    "$1 ",
  );

  const order = new Map<string, number>();
  return out.replace(MARK_REGEX, (_match, tweetId: string) => {
    if (!order.has(tweetId)) order.set(tweetId, order.size + 1);
    return `[${order.get(tweetId)}](${DEFAULT_TWEET_STATUS_URL}${tweetId})`;
  });
};

// extract Unix timestamp from a UUID v7 value without an external library
export function extractTimestampFromUUIDv7(uuid: string): Date {
  // split the UUID into its components
  const parts = uuid.split("-");

  // the second part of the UUID contains the high bits of the timestamp (48 bits in total)
  const highBitsHex = parts[0] + parts[1].slice(0, 4);

  // convert the high bits from hex to decimal
  // the UUID v7 timestamp is the number of milliseconds since Unix epoch (January 1, 1970)
  const timestampInMilliseconds = parseInt(highBitsHex, 16);

  // convert the timestamp to a Date object
  const date = new Date(timestampInMilliseconds);

  return date;
}
