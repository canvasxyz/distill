import { TweetsView } from "./TweetsView";
import { usePagination } from "../hooks/usePagination";
import { ShowIfTweetsLoaded } from "./ShowIfTweetsLoaded";
import { useStore } from "../state/store";
import { useFilterBySearchParam } from "../hooks/useFilterBySearchParam";
import { useSearchParams } from "react-router";

function IncludedTweetsViewInner() {
  const { includedTweets } = useStore();

  const [params] = useSearchParams();
  const searchParam = params.get("search");

  const filteredTweets = useFilterBySearchParam(searchParam, includedTweets);

  const {
    itemsToDisplay: paginatedIncludedTweets,
    navigateNext,
    navigatePrevious,
  } = usePagination({
    items: filteredTweets,
    limit: 20,
  });

  return (
    <TweetsView
      searchParam={searchParam}
      allTweets={filteredTweets!}
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
