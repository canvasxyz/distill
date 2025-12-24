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

export const TWEET_STATUS_URL_REGEX =
  /^https?:\/\/(?:x|twitter)\.com\/(?:(?:[^/\s]+|i(?:\/web)?)\/status)\/\d+(?:\?[^\s)]+)?$/i;
const DEFAULT_TWEET_STATUS_URL = "https://x.com/i/status/";

export const extractTweetIdFromUrl = (url: string) => {
  const match = url.match(/status\/(\d+)/i);
  return match ? match[1] : null;
};

const normalizeTweetUrl = (_url: string, tweetId: string) => {
  return `${DEFAULT_TWEET_STATUS_URL}${tweetId}`;
};

type CitationMatch = {
  tweetId: string;
  url: string;
};

const buildCitationMarkdown = (
  citations: CitationMatch[],
  getCitationIndex: (tweetId: string) => number,
) => {
  if (citations.length === 0) return "";
  return citations
    .map(({ tweetId, url }) => {
      const index = getCitationIndex(tweetId);
      return `[${index}](${normalizeTweetUrl(url, tweetId)})`;
    })
    .join(" ");
};

/**
 * Detects parenthetical tweet citations like `(1234567890123456789)`
 * or `([123](https://x.com/user/status/123))` and replaces them with
 * numbered Markdown links (e.g. `[1](https://x.com/...) [2](...)`).
 * It also renumbers inline tweet links so their text becomes the
 * citation number. These numbers are later rendered as superscripts.
 */
export const formatTweetCitations = (text: string) => {
  const citationOrder = new Map<string, number>();
  const getCitationIndex = (tweetId: string) => {
    if (!citationOrder.has(tweetId)) {
      citationOrder.set(tweetId, citationOrder.size + 1);
    }
    return citationOrder.get(tweetId)!;
  };

  const linkGroupRegex =
    /\(\s*(\[[0-9]{5,}\]\(https?:\/\/(?:x|twitter)\.com\/[^)]+\)\s*(?:,\s*\[[0-9]{5,}\]\(https?:\/\/(?:x|twitter)\.com\/[^)]+\)\s*)*)\s*\)/gi;
  const markdownLinkRegex =
    /\[([0-9]{5,})\]\((https?:\/\/(?:x|twitter)\.com\/[^)]+)\)/gi;

  let formattedText = text.replace(linkGroupRegex, (match) => {
    markdownLinkRegex.lastIndex = 0;
    const citations: CitationMatch[] = [];
    let innerMatch: RegExpExecArray | null;
    while ((innerMatch = markdownLinkRegex.exec(match)) !== null) {
      const [, tweetId, url] = innerMatch;
      if (!TWEET_STATUS_URL_REGEX.test(url)) continue;
      citations.push({
        tweetId,
        url,
      });
    }
    if (citations.length === 0) return match;
    return buildCitationMarkdown(citations, getCitationIndex);
  });

  const plainIdGroupRegex = /\(\s*(\d{5,}(?:\s*,\s*\d{5,})*)\s*\)/g;

  formattedText = formattedText.replace(plainIdGroupRegex, (match, inner) => {
    const ids = inner
      .split(",")
      .map((id: string) => id.trim())
      .filter((id: string) => /^\d{5,}$/.test(id));
    if (ids.length === 0) return match;
    const citations = ids.map((tweetId) => ({
      tweetId,
      url: `${DEFAULT_TWEET_STATUS_URL}${tweetId}`,
    }));
    return buildCitationMarkdown(citations, getCitationIndex);
  });

  const bracketIdGroupRegex =
    /\[\s*(\d{12,}(?:\s*,\s*\d{12,})*)\s*\](?!\()/g;

  formattedText = formattedText.replace(bracketIdGroupRegex, (match, inner) => {
    const ids = inner
      .split(",")
      .map((id: string) => id.trim())
      .filter((id: string) => /^\d{12,}$/.test(id));
    if (ids.length === 0) return match;
    const citations = ids.map((tweetId) => ({
      tweetId,
      url: `${DEFAULT_TWEET_STATUS_URL}${tweetId}`,
    }));
    return buildCitationMarkdown(citations, getCitationIndex);
  });

  const standaloneTweetLinkRegex =
    /\[[^\]]+\]\((https?:\/\/(?:x|twitter)\.com\/[^)]+)\)/gi;

  formattedText = formattedText.replace(
    standaloneTweetLinkRegex,
    (match, url: string) => {
      if (!TWEET_STATUS_URL_REGEX.test(url)) return match;
      const tweetId = extractTweetIdFromUrl(url);
      if (!tweetId) return match;
      const index = getCitationIndex(tweetId);
      return `[${index}](${normalizeTweetUrl(url, tweetId)})`;
    },
  );

  return formattedText;
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
