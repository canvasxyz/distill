import type { StateCreator } from "zustand";
import type { StoreSlices } from "./types";

export type LlmQuerySlice = {};

export const createLlmQuerySlice: StateCreator<
  StoreSlices,
  [],
  [],
  LlmQuerySlice
> = (set, get) => ({});
