import type { QueryResult } from "./ai_utils";
import type { Tweet } from "../../types";

export function getAnswerPosts(result: QueryResult) {
  const posts = new Map<string, Tweet>();
  const unavailable = new Set<string>();
  Object.values(result.batchStatuses).forEach((batch) => {
    if (batch.status !== "done") return;
    batch.groundedTweets.genuine.forEach((tweet) =>
      posts.set(tweet.id_str || tweet.id, tweet),
    );
    batch.groundedTweets.hallucinated.forEach((id) => unavailable.add(id));
  });
  return { posts: [...posts.values()], unavailable: [...unavailable] };
}

export function getAnswerScope(result: QueryResult) {
  const { posts } = getAnswerPosts(result);
  if (!posts.length) return "Post scope unavailable";
  const dates = posts
    .map((p) => new Date(p.created_at).getTime())
    .filter(Number.isFinite);
  const format = (time: number) =>
    new Date(time).toLocaleDateString(undefined, {
      month: "short",
      year: "numeric",
    });
  const range = dates.length
    ? [format(Math.min(...dates)), format(Math.max(...dates))]
    : [];
  return [
    `${posts.length.toLocaleString()} ${posts.length === 1 ? "post" : "posts"} used`,
    ...new Set(range),
  ].join(" · ");
}
