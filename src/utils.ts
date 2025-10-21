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
          Object.entries(obj).map(([k, v]) => [fn(k), mapKeysDeep(v, fn)])
        )
      : obj;
