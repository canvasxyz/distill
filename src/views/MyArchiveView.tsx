import { useState } from "react";
import { useStore } from "../state/store";
import { ModelQuerySection } from "./query_view/ModelQueryView";
import { LoadingView } from "./LoadingView";
import { ArchiveDropZone } from "../components/ArchiveDropZone";
import { CommunityArchiveUserModal } from "../components/CommunityArchiveUserModal";
import { getCommunityArchiveUserProgressLabel } from "../components/CommunityArchiveUserProgress";
import { Header } from "../components/Header";
import { Box, Flex, IconButton, Button } from "@radix-ui/themes";
import { useTheme } from "../components/ThemeProvider";

export function MyArchiveView() {
  const { appIsReady, loadCommunityArchiveUserProgress } = useStore();
  const [showModal, setShowModal] = useState(false);
  const { appearance, toggleTheme } = useTheme();

  return (
    <Box style={{ width: "100%" }}>
      {appIsReady ? (
        <>
          <Header
            leftContent={<div style={{ fontWeight: 600 }}>Distill Search</div>}
            rightContent={
              <>
                <ArchiveDropZone />
                {loadCommunityArchiveUserProgress ? (
                  <Button disabled size="2" variant="outline" color="indigo">
                    {getCommunityArchiveUserProgressLabel(
                      loadCommunityArchiveUserProgress,
                    )}
                  </Button>
                ) : (
                  <Button
                    onClick={() => setShowModal(true)}
                    size="2"
                    variant="outline"
                    color="blue"
                  >
                    Select from Community Archive
                  </Button>
                )}
                <IconButton
                  onClick={toggleTheme}
                  variant="outline"
                  size="2"
                  style={{ padding: "0 2px" }}
                  title={
                    appearance === "dark"
                      ? "Switch to light theme"
                      : "Switch to dark theme"
                  }
                >
                  {appearance === "dark" ? "☀️" : "🌙"}
                </IconButton>
              </>
            }
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
          <CommunityArchiveUserModal
            showModal={showModal}
            setShowModal={setShowModal}
          />
        </>
      ) : (
        <LoadingView />
      )}
    </Box>
  );
}
