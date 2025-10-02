import { useStore } from "../store";
import { TweetsView } from "./TweetsView";
import { Navigate, useParams } from "react-router";
import { filters } from "../filtering/filters";
import { usePagination } from "../hooks/usePagination";

export function FilteredTweetsView() {
  const params = useParams();
  const { tweets, labelsByTweetId } = useStore();

  const filterName = params.filter as string;
  const filteredTweets = (tweets || []).filter(
    (tweet) =>
      labelsByTweetId[tweet.id]
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

  if (tweets === null) {
    return <Navigate to="/upload-tweets" />;
  }

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
