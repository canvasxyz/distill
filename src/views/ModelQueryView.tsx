import { ShowIfTweetsLoaded } from "./ShowIfTweetsLoaded";

function ModelQueryViewInner() {
  return <>Model Query View!</>;
}

export function ModelQueryView() {
  return (
    <ShowIfTweetsLoaded>
      <ModelQueryViewInner />
    </ShowIfTweetsLoaded>
  );
}
