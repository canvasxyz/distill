import { useState } from "react";
import { useStore } from "../state/store";
import { ModelQuerySection } from "./query_view/ModelQueryView";
import { LoadingView } from "./LoadingView";
import { FeedbackButtons } from "../components/FeedbackButtons";
import { ArchiveDropZone } from "../components/ArchiveDropZone";
import { CommunityArchiveUserModal } from "../components/CommunityArchiveUserModal";
import { getCommunityArchiveUserProgressLabel } from "../components/CommunityArchiveUserProgress";
import { Header } from "../components/Header";
import { Box, Flex } from "@radix-ui/themes";

export function MyArchiveView() {
  const { appIsReady, loadCommunityArchiveUserProgress } = useStore();
  const [showModal, setShowModal] = useState(false);

  return (
    <Box style={{ width: "100%" }}>
      {appIsReady ? (
        <>
          <Header
            leftContent={<div style={{ fontWeight: 600 }}>Run Query</div>}
            rightContent={
              <>
                <ArchiveDropZone />
                {loadCommunityArchiveUserProgress ? (
                  <button
                    style={{
                      padding: "6px 10px",
                      borderRadius: 6,
                      fontSize: "0.875rem",
                    }}
                    disabled
                  >
                    {getCommunityArchiveUserProgressLabel(
                      loadCommunityArchiveUserProgress,
                    )}
                  </button>
                ) : (
                  <button
                    style={{
                      padding: "6px 10px",
                      borderRadius: 6,
                      fontSize: "0.875rem",
                    }}
                    onClick={() => setShowModal(true)}
                  >
                    Select from Community Archive
                  </button>
                )}
              </>
            }
          />
          <Flex
            direction="column"
            p="4"
            style={{
              margin: "0 auto",
              maxWidth: "1200px",
            }}
          >
            <Box height="2" />
            <ModelQuerySection />
            <FeedbackButtons />
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
