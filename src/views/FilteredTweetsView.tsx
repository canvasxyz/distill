import { useStore } from "../store";
import { TweetsView } from "./TweetsView";
import { useParams } from "react-router";
import { filters } from "../filtering/filters";
import { usePagination } from "../hooks/usePagination";
import { ShowIfTweetsLoaded } from "./ShowIfTweetsLoaded";

function FilteredTweetsViewInner() {
  const params = useParams();
  const { allTweets, filterMatchesByTweetId } = useStore();

  const filterName = params.filter as string;
  const filteredTweets = (allTweets || []).filter(
    (tweet) =>
      (filterMatchesByTweetId[tweet.id] || [])
        .map((result) => result.filterName)
        .indexOf(filterName) !== -1
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
