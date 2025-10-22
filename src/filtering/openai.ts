export const serverUrl = "https://tweet-analysis-worker.bob-wbb.workers.dev";

export const systemPrompt = {
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

/no_think

  `,
} as const;

const singleClassificationSchema = {
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
} as const;

export const classifyResponseFormat = {
  type: "json_schema",
  json_schema: {
    name: "tweet_classification",
    schema: singleClassificationSchema,
  },
} as const;

export const classificationLabels = [
  "Offensive",
  "Beef",
  "Dunk",
  "Horny",
  "NSFW",
] as const;

function stripThinkTags(text: string) {
  return text.replace(/<think>.*?<\/think>/gs, "").trim();
}

export const getClassification = async (text: string, model: string) => {
  const classificationResponse = await fetch(serverUrl, {
    method: "POST",
    body: JSON.stringify({
      params: {
        model,
        messages: [
          systemPrompt,
          {
            role: "user" as const,
            content: `<Tweet>${JSON.stringify(text)}</Tweet>`,
          },
        ],
        response_format: classifyResponseFormat,
      },
      provider: "deepinfra",
    }),
    headers: { "Content-Type": "application/json" },
  });
  const data = await classificationResponse.json();

  // try to directly parse result
  try {
    const result = JSON.parse(data.choices[0].message.content);
    return result;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    // do nothing
  }

  // maybe it has the <think></think> tag, try to remove it then parse again

  const contentNoThink = stripThinkTags(data.choices[0].message.content);

  // Parse structured output
  try {
    return JSON.parse(contentNoThink);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    // failed to parse whole response - maybe it includes a thinking part?
  }

  return null;
};
