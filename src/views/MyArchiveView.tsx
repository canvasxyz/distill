import { useStore } from "../state/store";
import { ModelQuerySection } from "./query_view/ModelQueryView";
import { LoadingView } from "./LoadingView";
import { FeedbackButtons } from "../components/FeedbackButtons";
import { Box, Flex } from "@radix-ui/themes";

export function MyArchiveView() {
  const { appIsReady } = useStore();

  return (
    <Box>
      {appIsReady ? (
        <Flex
          direction="column"
          p="4"
          style={{
            maxHeight: "100vh",
            margin: "0 auto",
            maxWidth: "1200px",
          }}
        >
          <Box h="2" />
          <ModelQuerySection />
          <FeedbackButtons />
        </Flex>
      ) : (
        <LoadingView />
      )}
    </Box>
  );
}
