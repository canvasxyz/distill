import { Navigate } from "react-router";
import { usePagination } from "../hooks/usePagination";
import { useStore } from "../store";
import { TweetsView } from "./TweetsView";

export function AllTweetsView() {
  const { tweets } = useStore();
  const { itemsToDisplay, navigateNext, navigatePrevious } = usePagination({
    items: tweets,
    limit: 20,
  });

  if (tweets === null) {
    return <Navigate to="upload-tweets" />;
  }

  return (
    <TweetsView
      title="All Tweets"
      tweetsToDisplay={itemsToDisplay!}
      navigateNext={navigateNext}
      navigatePrevious={navigatePrevious}
    />
  );
}
