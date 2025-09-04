import { useMemo } from "react";
import { useStore } from "../store";
import { TweetsView } from "./TweetsView";
import { UploadView } from "./UploadView";
import { useParams } from "react-router";
import { filters } from "../filters";

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

  const filter = filters.filter((f) => f.name === filterName)[0];

  return (
    <TweetsView
      title={filter.label}
      blurb={filter.blurb}
      tweetsToDisplay={filteredTweetsToDisplay}
    />
  );
}
