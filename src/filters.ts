import { offensiveWordsRegExp } from "./offensive";
import type { Tweet } from "./types";

export const filters = [
  {
    label: "Embarrassing 🫣",
    name: "embarrassing",
    shouldFilter: () => false,
    blurb: "Tweets that contain embarrassing personal information",
  },
  {
    label: "Beef 🐄",
    name: "beef",
    shouldFilter: () => false,
    blurb: "Tweets that involve arguments and disputes with other people",
  },
  {
    label: "Illegal 🧑‍⚖️",
    name: "illegal",
    shouldFilter: () => false,
    blurb: "Tweets that make reference to illegal activities or content",
  },
  {
    label: "Controversial ⁉️",
    name: "controversial",
    shouldFilter: () => false,
    blurb:
      "Tweets that refer to controversial subject areas, e.g. politics and religion",
  },
  {
    label: "Offensive 🤬",
    name: "offensive",
    shouldFilter: (tweet: Tweet) => offensiveWordsRegExp.test(tweet.full_text),
    blurb: "Tweets that may be offensive to some users, e.g. profanity",
  },
  {
    label: "NSFW 🔞",
    name: "nsfw",
    shouldFilter: () => false,
    blurb: "Tweets that refer to sexually explicit or violent themes",
  },
];
