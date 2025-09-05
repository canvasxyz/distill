import { useStore } from "../store";
import { TweetsView } from "./TweetsView";
import { usePagination } from "../hooks/usePagination";
import { Navigate } from "react-router";

export function ExcludedTweetsView() {
  const { excludedTweets, tweets } = useStore();

  const {
    itemsToDisplay: paginatedExcludedTweets,
    navigateNext,
    navigatePrevious,
  } = usePagination({
    items: excludedTweets,
    limit: 20,
  });

  if (tweets === null) {
    return <Navigate to="/upload-tweets" />;
  }

  return (
    <TweetsView
      allTweets={excludedTweets!}
      title="Excluded Tweets"
      tweetsToDisplay={paginatedExcludedTweets!}
      navigateNext={navigateNext}
      navigatePrevious={navigatePrevious}
    />
  );
}
