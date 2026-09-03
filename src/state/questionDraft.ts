import { create } from "zustand";
import type { SetStateAction } from "react";
import { DEFAULT_QUERY_BATCH_SIZE } from "../constants";
import type { RangeSelection } from "../views/query_view/ai_utils";

type QuestionDraft = {
  selectedQuery: string;
  showFilters: boolean;
  includeReplies: boolean;
  includeRetweets: boolean;
  rangeSelection: RangeSelection;
  username: string | null;
};

// Keep the unfinished question in memory while visiting the people page.
// Existing localStorage rules still govern what survives a browser reload.
export const useQuestionDraft = create<
  QuestionDraft & {
    setSelectedQuery: (value: SetStateAction<string>) => void;
    setShowFilters: (value: boolean) => void;
    setIncludeReplies: (value: boolean) => void;
    setIncludeRetweets: (value: boolean) => void;
    setRangeSelection: (value: RangeSelection) => void;
    setDraftUsername: (value: string | null) => void;
  }
>((set) => ({
  selectedQuery: "",
  showFilters: false,
  includeReplies: true,
  includeRetweets: true,
  rangeSelection: { type: "last-tweets", numTweets: DEFAULT_QUERY_BATCH_SIZE },
  username: null,
  setSelectedQuery: (value) =>
    set((state) => ({
      selectedQuery:
        typeof value === "function" ? value(state.selectedQuery) : value,
    })),
  setShowFilters: (showFilters) => set({ showFilters }),
  setIncludeReplies: (includeReplies) => set({ includeReplies }),
  setIncludeRetweets: (includeRetweets) => set({ includeRetweets }),
  setRangeSelection: (rangeSelection) => set({ rangeSelection }),
  setDraftUsername: (username) => set({ username }),
}));
