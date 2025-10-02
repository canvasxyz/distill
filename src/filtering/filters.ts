import { illegalWordsRegExp } from "./illegal";
import { offensiveWordsRegExp } from "./offensive";
import type { Tweet } from "../types";

export type FilterMatch =
  | { filter: false; type: "llm" }
  | { filter: true; type: "llm" }
  | { filter: false; type: "regex" }
  | { filter: true; type: "regex"; matches: RegExpExecArray };

export const filters: {
  label: string;
  name: string;
  evaluateFilter: (tweet: Tweet) => FilterMatch;
  blurb: string;
}[] = [
  // not yet implemented - use LLM?
  // {
  //   label: "Embarrassing 🫣",
  //   name: "embarrassing",
  // evaluateFilter: () => ({
  //   filter: false,
  // }),
  //   blurb: "Tweets that contain embarrassing personal information",
  // },
  {
    label: "Beef 🐄",
    name: "beef",
    evaluateFilter: () => ({
      filter: false,
      type: "llm",
    }),
    blurb: "Tweets that involve arguments and disputes with other people",
  },
  {
    label: "Dunk 🤣",
    name: "dunk",
    evaluateFilter: () => ({
      filter: false,
      type: "llm",
    }),
    blurb:
      "Tweets that involve people dunking on other people, criticising, slandering",
  },
  {
    label: "Illegal 🧑‍⚖️",
    name: "illegal",
    evaluateFilter: (tweet: Tweet) => {
      const execResult = illegalWordsRegExp.exec(tweet.full_text);
      if (execResult) {
        return { filter: true, type: "regex", matches: execResult };
      } else {
        return { filter: false, type: "regex" };
      }
    },
    blurb: "Tweets that make reference to illegal activities or content",
  },
  // not yet implemented - use LLM?
  // {
  //   label: "Controversial ⁉️",
  //   name: "controversial",
  // evaluateFilter: () => ({
  //   filter: false,
  // }),
  //   blurb:
  //     "Tweets that refer to controversial subject areas, e.g. politics and religion",
  // },
  {
    label: "Horny 😳",
    name: "horny",
    evaluateFilter: () => ({
      filter: false,
      type: "llm",
    }),
    blurb: "Sexually provocative, flirty tweets",
  },
  {
    label: "Offensive 🤬",
    name: "offensive",
    evaluateFilter: (tweet: Tweet) => {
      const execResult = offensiveWordsRegExp.exec(tweet.full_text);
      if (execResult) {
        return { filter: true, type: "regex", matches: execResult };
      } else {
        return { filter: false, type: "regex" };
      }
    },
    blurb: "Tweets that may be offensive to some users, e.g. profanity",
  },
  {
    label: "NSFW 🔞",
    name: "nsfw",
    evaluateFilter: () => ({
      filter: false,
      type: "llm",
    }),
    blurb: "Tweets that refer to sexually explicit or violent themes",
  },
];
