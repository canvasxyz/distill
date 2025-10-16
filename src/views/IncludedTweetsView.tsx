import { TweetsView } from "./TweetsView";
import { usePagination } from "../hooks/usePagination";
import { ShowIfTweetsLoaded } from "./ShowIfTweetsLoaded";
import { useStore } from "../state/store";

function IncludedTweetsViewInner() {
  const { includedTweets } = useStore();

  const {
    itemsToDisplay: paginatedIncludedTweets,
    navigateNext,
    navigatePrevious,
  } = usePagination({
    items: includedTweets,
    limit: 20,
  });

  return (
    <TweetsView
      allTweets={includedTweets!}
      title="Included Tweets"
      tweetsToDisplay={paginatedIncludedTweets!}
      navigateNext={navigateNext}
      navigatePrevious={navigatePrevious}
    />
  );
}
export function IncludedTweetsView() {
  return (
    <ShowIfTweetsLoaded>
      <IncludedTweetsViewInner />
    </ShowIfTweetsLoaded>
  );
}
