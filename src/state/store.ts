import { create } from "zustand";
import { createAnalysisSlice } from "./analysis";
import { createInitSlice } from "./init";
import { createSubscriptionSlice } from "./subscription";
import type { StoreSlices } from "./types";

export const useStore = create<StoreSlices>((...a) => ({
  ...createAnalysisSlice(...a),
  ...createInitSlice(...a),
  ...createSubscriptionSlice(...a),
}));
