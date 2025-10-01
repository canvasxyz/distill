export const illegalWords = [
  "weed",
  "marijuana",
  "cocaine",
  "lsd",
  "mdma",
  "blunt",
  "ketamine",
  "ket",
  "k hole",
  "heroin",
  "dope",
  "bob hope",
  "crack",
];

export const illegalWordsRegExp = new RegExp(illegalWords.join("|"));
