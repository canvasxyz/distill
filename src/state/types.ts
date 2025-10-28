import type { InitSlice } from "./init";
import type { LlmQuerySlice } from "./llm_query";
import type { SubscriptionSlice } from "./subscription";

export type StoreSlices = InitSlice & LlmQuerySlice & SubscriptionSlice;
