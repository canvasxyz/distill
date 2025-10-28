import { create } from "zustand";
import { createInitSlice } from "./init";
import { createSubscriptionSlice } from "./subscription";
import type { StoreSlices } from "./types";
import { createLlmQuerySlice } from "./llm_query";

export const useStore = create<StoreSlices>((...a) => ({
  ...createInitSlice(...a),
  ...createSubscriptionSlice(...a),
  ...createLlmQuerySlice(...a),
}));
