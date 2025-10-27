import { useStore } from "../state/store";
import { TweetsView } from "./TweetsView";
import { useParams, useSearchParams } from "react-router";
import { filters } from "../filtering/filters";
import { usePagination } from "../hooks/usePagination";
import { ShowIfTweetsLoaded } from "./ShowIfTweetsLoaded";
import { useFilterBySearchParam } from "../hooks/useFilterBySearchParam";

function FilteredTweetsViewInner() {
  const params = useParams();
  const { allTweets, filterMatchesByTweetId } = useStore();

  const [searchParams] = useSearchParams();
  const searchParam = searchParams.get("search");

  const filterName = params.filter as string;
  const filteredTweetsByFilter = (allTweets || []).filter(
    (tweet) =>
      (filterMatchesByTweetId[tweet.id] || [])
        .map((result) => result.filterName)
        .indexOf(filterName) !== -1,
  );

  const filteredTweets = useFilterBySearchParam(
    searchParam,
    filteredTweetsByFilter,
  );

  const {
    itemsToDisplay: paginatedFilteredTweets,
    navigateNext,
    navigatePrevious,
  } = usePagination({
    items: filteredTweets,
    limit: 20,
  });

  const filter = filters.filter((f) => f.name === filterName)[0];

  return (
    <TweetsView
      searchParam={searchParam}
      allTweets={filteredTweets}
      title={filter.label}
      blurb={filter.blurb}
      tweetsToDisplay={paginatedFilteredTweets!}
      navigateNext={navigateNext}
      navigatePrevious={navigatePrevious}
    />
  );
}

export function FilteredTweetsView() {
  return (
    <ShowIfTweetsLoaded>
      <FilteredTweetsViewInner />
    </ShowIfTweetsLoaded>
  );
}
