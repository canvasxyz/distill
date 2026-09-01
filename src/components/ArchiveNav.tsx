import { useState } from "react";
import { Button, Flex, IconButton } from "@radix-ui/themes";
import { useStore } from "../state/store";
import { useTheme } from "./ThemeContext";
import { ArchiveDropZone } from "./ArchiveDropZone";
import { CommunityArchiveUserModal } from "./CommunityArchiveUserModal";
import { getCommunityArchiveUserProgressLabel } from "./CommunityArchiveUserProgress";

export function ArchiveNav() {
  const { appIsReady, loadCommunityArchiveUserProgress } = useStore();
  const { appearance, toggleTheme } = useTheme();
  const [showModal, setShowModal] = useState(false);

  if (!appIsReady) return null;

  return (
    <>
      <Flex className="archive-nav" align="center" justify="end" gap="2">
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
      </Flex>
      <CommunityArchiveUserModal
        showModal={showModal}
        setShowModal={setShowModal}
      />
    </>
  );
}
