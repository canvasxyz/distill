import { Spinner } from "@radix-ui/themes";

export function LoadingView() {
  return (
    <div className="loading-view" role="status">
      <div>
        <Spinner size="3" /> Getting things ready…
      </div>
    </div>
  );
}
