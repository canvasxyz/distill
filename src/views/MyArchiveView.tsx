import { useStore } from "../state/store";
import { ModelQuerySection } from "./query_view/ModelQueryView";
import { LoadingView } from "./LoadingView";
import { ArchiveHeaderActions } from "../components/ArchiveHeaderActions";
import { Header } from "../components/Header";
import { Box, Flex } from "@radix-ui/themes";

export function MyArchiveView() {
  const { appIsReady } = useStore();

  return (
    <Box style={{ width: "100%" }}>
      {appIsReady ? (
        <>
          <Header
            leftContent={<div style={{ fontWeight: 600 }}>Distill Search</div>}
            rightContent={<ArchiveHeaderActions />}
          />
          <Flex
            direction="column"
            p="4"
            style={{
              margin: "0 auto",
              maxWidth: "1200px",
              width: "100%",
              boxSizing: "border-box",
              overflowX: "hidden",
            }}
          >
            <Box height="2" />
            <ModelQuerySection />
          </Flex>
        </>
      ) : (
        <LoadingView />
      )}
    </Box>
  );
}
