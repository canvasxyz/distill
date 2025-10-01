export const illegalWords = [
  "weed",
  "marijuana",
  "cocaine",
  "lsd",
  "mdma",
  "blunt",
  "ketamine",
  "k hole",
  "heroin",
  "dope",
  "bob hope",
  "crack",
];

export const illegalWordsRegExp = new RegExp(
  illegalWords.map((word) => `\\b${word}\\b`).join("|")
);
