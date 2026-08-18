import type { InitSlice } from "./init";
import type { LlmQuerySlice } from "./llm_query";
import type { SubscriptionSlice } from "./subscription";
import type { AvatarSlice } from "./avatar";

export type StoreSlices = InitSlice &
  LlmQuerySlice &
  SubscriptionSlice &
  AvatarSlice;
