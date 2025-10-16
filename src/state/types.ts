import type { AnalysisSlice } from "./analysis";
import type { InitSlice } from "./init";
import type { SubscriptionSlice } from "./subscription";

export type StoreSlices = AnalysisSlice & InitSlice & SubscriptionSlice;
