import type { LoadCommunityArchiveUserProgress } from "../state/init";

export function getCommunityArchiveUserProgressLabel(
  progress: LoadCommunityArchiveUserProgress,
) {
  if (progress.status === "starting") {
    return "Starting download...";
  } else if (progress.status === "loadingTweets") {
    return `Loading tweets... (${progress.tweetsLoaded}/${progress.totalNumTweets})`;
  } else if (progress.status === "loadingProfile") {
    return "Loading profile";
  } else if (progress.status === "loadingAccount") {
    return "Loading account";
  } else if (progress.status === "generatingTextIndex") {
    return "Generating text index";
  }
}
