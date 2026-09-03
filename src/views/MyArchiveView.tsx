import { useStore } from "../state/store";
import { ModelQuerySection } from "./query_view/ModelQueryView";
import { LoadingView } from "./LoadingView";
import { Box } from "@radix-ui/themes";

export function MyArchiveView() {
  const { appIsReady } = useStore();

  return (
    <Box style={{ width: "100%" }}>
      {appIsReady ? (
        <>
          <ModelQuerySection />
        </>
      ) : (
        <LoadingView />
      )}
    </Box>
  );
}
