import { TweetsView } from "./TweetsView";
import { usePagination } from "../hooks/usePagination";
import { ShowIfTweetsLoaded } from "./ShowIfTweetsLoaded";
import { useStore } from "../state/store";

function ExcludedTweetsViewInner() {
  const { excludedTweets } = useStore();

  const {
    itemsToDisplay: paginatedExcludedTweets,
    navigateNext,
    navigatePrevious,
  } = usePagination({
    items: excludedTweets,
    limit: 20,
  });

  return (
    <TweetsView
      allTweets={excludedTweets}
      title="Excluded Tweets"
      tweetsToDisplay={paginatedExcludedTweets!}
      navigateNext={navigateNext}
      navigatePrevious={navigatePrevious}
    />
  );
}

export function ExcludedTweetsView() {
  return (
    <ShowIfTweetsLoaded>
      <ExcludedTweetsViewInner />
    </ShowIfTweetsLoaded>
  );
}
