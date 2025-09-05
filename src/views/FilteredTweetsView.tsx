import { useStore } from "../store";
import { TweetsView } from "./TweetsView";
import { UploadView } from "./UploadView";
import { useParams } from "react-router";
import { filters } from "../filters";
import { usePagination } from "../hooks/usePagination";

export function FilteredTweetsView() {
  const params = useParams();
  const { tweetsByLabel } = useStore();

  const filterName = params.filter as string;

  const {
    itemsToDisplay: paginatedFilteredTweets,
    navigateNext,
    navigatePrevious,
  } = usePagination({
    items: tweetsByLabel[filterName],
    limit: 20,
  });

  if (paginatedFilteredTweets === null) {
    return <UploadView />;
  }

  const filter = filters.filter((f) => f.name === filterName)[0];

  return (
    <TweetsView
      title={filter.label}
      blurb={filter.blurb}
      tweetsToDisplay={paginatedFilteredTweets}
      navigateNext={navigateNext}
      navigatePrevious={navigatePrevious}
    />
  );
}
