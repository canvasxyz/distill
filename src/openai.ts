export const serverUrl = "https://tweet-analysis-worker.bob-wbb.workers.dev";

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
    body: JSON.stringify({ text, model }),
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
