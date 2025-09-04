import { useStore } from "../store";
import { TweetsView } from "./TweetsView";
import { UploadView } from "./UploadView";

export function AllTweetsView() {
  const { tweets } = useStore();
  if (tweets === null) {
    return <UploadView />;
  }
  return <TweetsView tweetsToDisplay={tweets} />;
}
