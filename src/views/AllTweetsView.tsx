import { usePagination } from "../hooks/usePagination";
import { TweetsView } from "./TweetsView";
import { db } from "../db";
import { useLiveQuery } from "dexie-react-hooks";
import { ShowIfTweetsLoaded } from "./ShowIfTweetsLoaded";

function AllTweetsViewInner() {
  const tweets = useLiveQuery(() => db.tweets.toArray());
  const { itemsToDisplay, navigateNext, navigatePrevious } = usePagination({
    items: tweets || [],
    limit: 20,
  });

  return (
    <TweetsView
      title="All Tweets"
      allTweets={tweets || []}
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
