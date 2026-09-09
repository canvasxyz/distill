import type { FetchPostsProgress } from "../state/init";

export function getFetchPostsProgressLabel(progress: FetchPostsProgress) {
  return `Fetching posts for @${progress.username}… (${progress.loaded.toLocaleString()}/${progress.total.toLocaleString()})`;
}
