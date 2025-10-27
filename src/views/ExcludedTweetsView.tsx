import { TweetsView } from "./TweetsView";
import { usePagination } from "../hooks/usePagination";
import { ShowIfTweetsLoaded } from "./ShowIfTweetsLoaded";
import { useStore } from "../state/store";
import { useFilterBySearchParam } from "../hooks/useFilterBySearchParam";
import { useSearchParams } from "react-router";

function ExcludedTweetsViewInner() {
  const { excludedTweets } = useStore();

  const [params] = useSearchParams();
  const searchParam = params.get("search");

  const filteredTweets = useFilterBySearchParam(searchParam, excludedTweets);

  const {
    itemsToDisplay: paginatedExcludedTweets,
    navigateNext,
    navigatePrevious,
  } = usePagination({
    items: filteredTweets,
    limit: 20,
  });

  return (
    <TweetsView
      searchParam={searchParam}
      allTweets={filteredTweets}
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
