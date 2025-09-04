import { useMemo } from "react";
import { useStore } from "../store";
import { TweetsView } from "./TweetsView";
import { UploadView } from "./UploadView";
import { useParams } from "react-router";

export function FilteredTweetsView() {
  const params = useParams();
  const { tweets, tweetsById, tweetIdsByLabel } = useStore();

  const filterName = params.filter as string;

  const filteredTweetsToDisplay = useMemo(() => {
    const tweetIds = tweetIdsByLabel[filterName] || [];
    return tweetIds.map((tweetId) => tweetsById[tweetId]);
  }, [tweetsById, tweetIdsByLabel, filterName]);

  if (tweets === null) {
    return <UploadView />;
  }

  return <TweetsView tweetsToDisplay={filteredTweetsToDisplay} />;
}
