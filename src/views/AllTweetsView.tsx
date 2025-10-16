import { usePagination } from "../hooks/usePagination";
import { TweetsView } from "./TweetsView";
import { ShowIfTweetsLoaded } from "./ShowIfTweetsLoaded";
import { useStore } from "../state/store";

function AllTweetsViewInner() {
  const { allTweets } = useStore();
  const { itemsToDisplay, navigateNext, navigatePrevious } = usePagination({
    items: allTweets || [],
    limit: 20,
  });

  return (
    <TweetsView
      title="All Tweets"
      allTweets={allTweets || []}
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
