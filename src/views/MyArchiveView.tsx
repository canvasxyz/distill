import { useStore } from "../state/store";
import { ModelQuerySection } from "./query_view/ModelQueryView";
import { LoadingView } from "./LoadingView";
import { Header } from "../components/Header";
import { Box } from "@radix-ui/themes";

export function MyArchiveView() {
  const { appIsReady } = useStore();

  return (
    <Box style={{ width: "100%" }}>
      {appIsReady ? (
        <>
          <Header title="Distill Search" />
          <ModelQuerySection />
        </>
      ) : (
        <LoadingView />
      )}
    </Box>
  );
}
