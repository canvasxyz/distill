import { JSONParse } from "json-with-bigint";
import type OpenAI from "openai";

function stripThinkTags(text: string) {
  return text.replace(/<think>.*?<\/think>/gs, "").trim();
}

type ClassificationResult = {
  Offensive: number;
  Beef: number;
  Dunk: number;
  Horny: number;
  NSFW: number;
};

export const classificationLabels = [
  "Offensive",
  "Beef",
  "Dunk",
  "Horny",
  "NSFW",
] as const;

export async function classifyTweet(
  client: OpenAI,
  tweet: string,
  model: string
): Promise<ClassificationResult | null> {
  const response = await client.chat.completions.create({
    model,
    messages: [
      {
        role: "system",
        content: `You are a tweet classifier.
Given a tweet, output a JSON object with scores between 0 and 1 (inclusive) for each of the following categories:
- Offensive: Contains slurs, harassment, or hateful/abusive language.
- Beef: Targeted negativity or conflict between users, communities, or groups.
- Dunk: Mocking or ridiculing someone/something, often humorously.
- Horny: Expresses sexual desire, thirst, or innuendo.
- NSFW: Explicit sexual or graphic adult content (stronger than “Horny”).

The scores should represent the likelihood that the tweet belongs in each category. A score of 0 means "not at all" and 1 means "definitely."

Format your output strictly as JSON:
\`
{
  "Offensive": 0.0,
  "Beef": 0.0,
  "Dunk": 0.0,
  "Horny": 0.0,
  "NSFW": 0.0
}

\`

Example input: "Tweet: "Lmao this guy can’t even dribble, what a clown.""

\`
{
  "Offensive": 0.0,
  "Beef": 0.2,
  "Dunk": 0.9,
  "Horny": 0.0,
  "NSFW": 0.0
}
\`

        `,
      },
      {
        role: "user",
        content: `Tweet: '${tweet}'`,
      },
    ],
    response_format: {
      type: "json_schema",
      max_tokens: 10000,
      json_schema: {
        name: "tweet_classification",
        schema: {
          type: "object",
          properties: {
            Offensive: { type: "number", minimum: 0, maximum: 1 },
            Beef: { type: "number", minimum: 0, maximum: 1 },
            Dunk: { type: "number", minimum: 0, maximum: 1 },
            Horny: { type: "number", minimum: 0, maximum: 1 },
            NSFW: { type: "number", minimum: 0, maximum: 1 },
          },
          required: ["Offensive", "Beef", "Dunk", "Horny", "NSFW"],
          additionalProperties: false,
        },
      },
    },
  });

  const responseContent = response.choices[0].message.content;
  if (responseContent === null) {
    return null;
  }

  const contentNoThink = stripThinkTags(responseContent);

  // Parse structured output
  try {
    return JSONParse(contentNoThink);
  } catch (e) {
    // failed to parse whole response - maybe it includes a thinking part?
  }

  try {
    const parts = contentNoThink.split("\n");
    const lastPart = parts[parts.length - 1];
    return JSONParse(lastPart);
  } catch (e) {}

  // if we cannot parse the response then don't return anything
  return null;
}
