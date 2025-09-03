import type { Tweet } from "./types";

export const filters = [
  {
    label: "Embarrassing 🫣",
    name: "embarrassing",
    shouldFilter: (tweet: Tweet) => false,
  },
  { label: "Beef 🐄", name: "beef", shouldFilter: (tweet: Tweet) => false },
  {
    label: "Illegal 🧑‍⚖️",
    name: "illegal",
    shouldFilter: (tweet: Tweet) => false,
  },
  {
    label: "Controversial ⁉️",
    name: "controversial",
    shouldFilter: (tweet: Tweet) => false,
  },
  {
    label: "Offensive 🤬",
    name: "offensive",
    shouldFilter: (tweet: Tweet) => tweet.full_text.includes("fuck"),
  },
  { label: "NSFW 🔞", name: "nsfw", shouldFilter: (tweet: Tweet) => false },
];
