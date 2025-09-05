import { useStore } from "../store";
import { TweetsView } from "./TweetsView";
import { usePagination } from "../hooks/usePagination";
import { Navigate } from "react-router";

export function IncludedTweetsView() {
  const { includedTweets, tweets } = useStore();

  const {
    itemsToDisplay: paginatedIncludedTweets,
    navigateNext,
    navigatePrevious,
  } = usePagination({
    items: includedTweets,
    limit: 20,
  });

  if (tweets === null) {
    return <Navigate to="/upload-tweets" />;
  }

  return (
    <TweetsView
      title="Included Tweets"
      tweetsToDisplay={paginatedIncludedTweets!}
      navigateNext={navigateNext}
      navigatePrevious={navigatePrevious}
    />
  );
}
