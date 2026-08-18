import type { StateCreator } from "zustand";
import { v7 as uuidv7 } from "uuid";
import type { StoreSlices } from "./types";
import type { Account, Tweet } from "../types";
import { db } from "../db";
import {
  DEFAULT_IMAGE_GEN_MODEL,
  IMAGE_GEN_MODELS,
  getBatchSizeForConfig,
  type LLMQueryConfig,
} from "../constants";
import { AVAILABLE_LLM_CONFIGS } from "./llm_query";
import {
  analyseTweetsForAvatar,
  generateAvatarImage,
} from "../views/avatar_view/avatar_utils";

export type GeneratedAvatar = {
  id: string;
  accountId: string;
  username: string;
  createdAt: string;
  description: string;
  imageDataUrl: string;
  textModel: string;
  imageModel: string;
  numTweets: number;
  cost?: number;
};

export type AvatarStage = "analysing" | "rendering";

export type AvatarSlice = {
  selectedImageModel: string;
  setSelectedImageModel: (model: string) => void;
  useCurrentAvatarAsReference: boolean;
  setUseCurrentAvatarAsReference: (v: boolean) => void;
  avatarStage: AvatarStage | null;
  avatarError: string | null;
  avatarDescription: string | null;
  latestAvatar: GeneratedAvatar | null;
  generateAvatar: (account: Account, tweets: Tweet[]) => Promise<void>;
  // Re-render an image from an existing description (skips the analysis step)
  regenerateAvatarImage: (avatar: GeneratedAvatar) => Promise<void>;
  deleteAvatar: (id: string) => Promise<void>;
};

const IMAGE_MODEL_STORAGE_KEY = "avatar:imageGenModel";
const loadStoredImageModel = (): string => {
  try {
    const stored = localStorage.getItem(IMAGE_MODEL_STORAGE_KEY);
    if (stored && IMAGE_GEN_MODELS.some((m) => m.id === stored)) return stored;
  } catch {
    // ignore
  }
  return DEFAULT_IMAGE_GEN_MODEL;
};

export const createAvatarSlice: StateCreator<
  StoreSlices,
  [],
  [],
  AvatarSlice
> = (set, get) => ({
  selectedImageModel: loadStoredImageModel(),
  setSelectedImageModel: (model) => {
    try {
      localStorage.setItem(IMAGE_MODEL_STORAGE_KEY, model);
    } catch {
      // ignore
    }
    set({ selectedImageModel: model });
  },
  useCurrentAvatarAsReference: true,
  setUseCurrentAvatarAsReference: (v) => set({ useCurrentAvatarAsReference: v }),
  avatarStage: null,
  avatarError: null,
  avatarDescription: null,
  latestAvatar: null,

  generateAvatar: async (account, tweets) => {
    if (get().avatarStage) return;
    const config: LLMQueryConfig =
      AVAILABLE_LLM_CONFIGS[get().selectedConfigIndex] || AVAILABLE_LLM_CONFIGS[0];
    const batchSize = getBatchSizeForConfig(config);
    // Most recent N tweets (tweets are stored newest-first)
    const sample = [...tweets]
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      )
      .slice(0, batchSize);

    if (sample.length === 0) {
      set({ avatarError: "No tweets available for this account." });
      return;
    }

    set({
      avatarStage: "analysing",
      avatarError: null,
      avatarDescription: null,
      latestAvatar: null,
    });
    try {
      const profile = await db.profiles.get(account.accountId);
      const analysis = await analyseTweetsForAvatar({
        tweets: sample,
        account,
        profile,
        config,
      });
      set({ avatarStage: "rendering", avatarDescription: analysis.description });

      const image = await generateAvatarImage({
        description: analysis.description,
        account,
        profile,
        model: get().selectedImageModel,
        includeCurrentAvatar: get().useCurrentAvatarAsReference,
      });

      const avatar: GeneratedAvatar = {
        id: uuidv7(),
        accountId: account.accountId,
        username: account.username,
        createdAt: new Date().toISOString(),
        description: analysis.description,
        imageDataUrl: image.imageDataUrl,
        textModel: analysis.model,
        imageModel: image.model,
        numTweets: sample.length,
        cost: image.cost,
      };
      await db.avatars.add(avatar);
      set({ avatarStage: null, latestAvatar: avatar });
    } catch (error) {
      console.error("Avatar generation failed:", error);
      set({
        avatarStage: null,
        avatarError:
          (error as Error)?.message || "Avatar generation failed. Please try again.",
      });
    }
  },

  regenerateAvatarImage: async (prev) => {
    if (get().avatarStage) return;
    const account = get().accounts.find((a) => a.accountId === prev.accountId);
    if (!account) {
      set({ avatarError: "Account for this avatar is no longer loaded." });
      return;
    }
    set({
      avatarStage: "rendering",
      avatarError: null,
      avatarDescription: prev.description,
      latestAvatar: null,
    });
    try {
      const profile = await db.profiles.get(account.accountId);
      const image = await generateAvatarImage({
        description: prev.description,
        account,
        profile,
        model: get().selectedImageModel,
        includeCurrentAvatar: get().useCurrentAvatarAsReference,
      });
      const avatar: GeneratedAvatar = {
        ...prev,
        id: uuidv7(),
        createdAt: new Date().toISOString(),
        imageDataUrl: image.imageDataUrl,
        imageModel: image.model,
        cost: image.cost,
      };
      await db.avatars.add(avatar);
      set({ avatarStage: null, latestAvatar: avatar });
    } catch (error) {
      console.error("Avatar re-render failed:", error);
      set({
        avatarStage: null,
        avatarError:
          (error as Error)?.message || "Avatar generation failed. Please try again.",
      });
    }
  },

  deleteAvatar: async (id) => {
    await db.avatars.delete(id);
    if (get().latestAvatar?.id === id) set({ latestAvatar: null });
  },
});
