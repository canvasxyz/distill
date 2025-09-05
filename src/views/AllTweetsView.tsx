import { usePagination } from "../hooks/usePagination";
import { useStore } from "../store";
import { TweetsView } from "./TweetsView";
import { UploadView } from "./UploadView";

export function AllTweetsView() {
  const { tweets } = useStore();
  const { itemsToDisplay, navigateNext, navigatePrevious } = usePagination({
    items: tweets,
    limit: 20,
  });

  if (itemsToDisplay === null) {
    return <UploadView />;
  }

  return (
    <TweetsView
      title="All Tweets"
      tweetsToDisplay={itemsToDisplay}
      navigateNext={navigateNext}
      navigatePrevious={navigatePrevious}
    />
  );
}
