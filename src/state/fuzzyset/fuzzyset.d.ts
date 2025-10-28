export type FuzzyMatch = [score: number, value: string];

export type GramMatch = [index: number, gramCount: number];

export type ItemEntry = [vectorNormal: number, normalizedValue: string];

export interface FuzzySetInstance {
  gramSizeLower: number;
  gramSizeUpper: number;
  useLevenshtein: boolean;
  exactSet: Record<string, string>;
  matchDict: Record<string, GramMatch[]>;
  items: Record<number, ItemEntry[]>;
  get(
    value: string,
    defaultValue?: string,
    minMatchScore?: number,
  ): FuzzyMatch[] | string | null;
  _get(value: string, minMatchScore?: number): FuzzyMatch[] | null;
  __get(
    value: string,
    gramSize: number,
    minMatchScore?: number,
  ): FuzzyMatch[] | null;
  add(value: string): false | void;
  _add(value: string, gramSize: number): void;
  _normalizeStr(value: string): string;
  length(): number;
  isEmpty(): boolean;
  values(): string[];
}

export interface FuzzySetConstructor {
  (
    arr?: string[],
    useLevenshtein?: boolean,
    gramSizeLower?: number,
    gramSizeUpper?: number,
  ): FuzzySetInstance;
  new (
    arr?: string[],
    useLevenshtein?: boolean,
    gramSizeLower?: number,
    gramSizeUpper?: number,
  ): FuzzySetInstance;
}

declare const FuzzySet: FuzzySetConstructor;

export default FuzzySet;
