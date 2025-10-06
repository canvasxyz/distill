import { useStore } from "../store";
import { TweetsView } from "./TweetsView";
import { useParams } from "react-router";
import { filters } from "../filtering/filters";
import { usePagination } from "../hooks/usePagination";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db";
import { ShowIfTweetsLoaded } from "./ShowIfTweetsLoaded";

function FilteredTweetsViewInner() {
  const params = useParams();
  const { labelsByTweetId } = useStore();
  const tweets = useLiveQuery(() => db.tweets.toArray());

  const filterName = params.filter as string;
  const filteredTweets = (tweets || []).filter(
    (tweet) =>
      (labelsByTweetId[tweet.id] || [])
        .map((result) => result.name)
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
