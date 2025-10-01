import { illegalWordsRegExp } from "./illegal";
import { offensiveWordsRegExp } from "./offensive";
import type { Tweet } from "./types";

export const filters = [
  {
    label: "Embarrassing 🫣",
    name: "embarrassing",
    shouldFilter: () => false,
    blurb: "Tweets that contain embarrassing personal information",
    requiresOpenrouter: true,
  },
  {
    label: "Beef 🐄",
    name: "beef",
    shouldFilter: () => false,
    blurb: "Tweets that involve arguments and disputes with other people",
    requiresOpenrouter: true,
  },
  {
    label: "Dunk 🤣",
    name: "dunk",
    shouldFilter: () => false,
    blurb:
      "Tweets that involve people dunking on other people, criticising, slandering",
    requiresOpenrouter: true,
  },
  {
    label: "Illegal 🧑‍⚖️",
    name: "illegal",
    shouldFilter: (tweet: Tweet) => illegalWordsRegExp.test(tweet.full_text),
    blurb: "Tweets that make reference to illegal activities or content",
    // requiresOpenrouter: true,
  },
  {
    label: "Controversial ⁉️",
    name: "controversial",
    shouldFilter: () => false,
    blurb:
      "Tweets that refer to controversial subject areas, e.g. politics and religion",
    requiresOpenrouter: true,
  },
  {
    label: "Horny 😳",
    name: "horny",
    shouldFilter: () => false,
    requiresOpenrouter: true,
    blurb: "Sexually provocative, flirty tweets",
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
    requiresOpenrouter: true,
  },
];
