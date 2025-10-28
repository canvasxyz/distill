import type { FuzzySetInstance, GramMatch, ItemEntry } from "./fuzzyset";
import FuzzySet from "./fuzzyset";

export type SerializedFuzzySet = {
  gramSizeLower: number;
  gramSizeUpper: number;
  useLevenshtein: boolean;
  exactSet: Record<string, string>;
  matchDict: Record<string, GramMatch[]>;
  items: Record<number, ItemEntry[]>;
};

export function serialize(fs: FuzzySetInstance): SerializedFuzzySet {
  return {
    gramSizeLower: fs.gramSizeLower,
    gramSizeUpper: fs.gramSizeUpper,
    useLevenshtein: fs.useLevenshtein,
    exactSet: fs.exactSet,
    matchDict: fs.matchDict,
    items: fs.items,
  };
}

export function deserialize(data: SerializedFuzzySet): FuzzySetInstance {
  const fs = FuzzySet();
  fs.gramSizeLower = data.gramSizeLower;
  fs.gramSizeUpper = data.gramSizeUpper;
  fs.useLevenshtein = data.useLevenshtein;
  fs.exactSet = data.exactSet;
  fs.matchDict = data.matchDict;
  fs.items = data.items;
  return fs;
}
