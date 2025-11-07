import { usePagination } from "../hooks/usePagination";
import { TweetsView } from "./TweetsView";
import { ShowIfTweetsLoaded } from "./ShowIfTweetsLoaded";
import { useStore } from "../state/store";
import { useFilterBySearchParam } from "../hooks/useFilterBySearchParam";
import { useSearchParams } from "react-router";

function AllTweetsViewInner() {
  const { allTweets } = useStore();

  const [params] = useSearchParams();
  const searchParam = params.get("search");

  const filteredTweets = useFilterBySearchParam(searchParam, allTweets);

  const { itemsToDisplay, navigateNext, navigatePrevious } = usePagination({
    items: filteredTweets,
    limit: 20,
  });

  return (
    <TweetsView
      searchParam={searchParam}
      title="All Tweets"
      allTweets={filteredTweets}
      tweetsToDisplay={itemsToDisplay!}
      navigateNext={navigateNext}
      navigatePrevious={navigatePrevious}
    />
  );
}

export function AllTweetsView() {
  return (
    <ShowIfTweetsLoaded>
      <AllTweetsViewInner />
    </ShowIfTweetsLoaded>
  );
}
