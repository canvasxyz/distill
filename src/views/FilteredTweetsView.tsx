import { useStore } from "../store";
import { TweetsView } from "./TweetsView";
import { Navigate, useParams } from "react-router";
import { filters } from "../filters/filters";
import { usePagination } from "../hooks/usePagination";

export function FilteredTweetsView() {
  const params = useParams();
  const { tweets, tweetsByLabel } = useStore();

  const filterName = params.filter as string;

  const {
    itemsToDisplay: paginatedFilteredTweets,
    navigateNext,
    navigatePrevious,
  } = usePagination({
    items: tweetsByLabel[filterName],
    limit: 20,
  });

  if (tweets === null) {
    return <Navigate to="/upload-tweets" />;
  }

  const filter = filters.filter((f) => f.name === filterName)[0];

  return (
    <TweetsView
      allTweets={tweetsByLabel[filterName]}
      title={filter.label}
      blurb={filter.blurb}
      tweetsToDisplay={paginatedFilteredTweets!}
      navigateNext={navigateNext}
      navigatePrevious={navigatePrevious}
    />
  );
}
