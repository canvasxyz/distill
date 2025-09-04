import type { Tweet } from "./types";

export const filters = [
  {
    label: "Embarrassing 🫣",
    name: "embarrassing",
    shouldFilter: () => false,
  },
  { label: "Beef 🐄", name: "beef", shouldFilter: () => false },
  {
    label: "Illegal 🧑‍⚖️",
    name: "illegal",
    shouldFilter: () => false,
  },
  {
    label: "Controversial ⁉️",
    name: "controversial",
    shouldFilter: () => false,
  },
  {
    label: "Offensive 🤬",
    name: "offensive",
    shouldFilter: (tweet: Tweet) => tweet.full_text.includes("fuck"),
  },
  { label: "NSFW 🔞", name: "nsfw", shouldFilter: () => false },
];
