import { useState } from "react";
import { Button, IconButton } from "@radix-ui/themes";
import { useStore } from "../state/store";
import { useTheme } from "./ThemeContext";
import { ArchiveDropZone } from "./ArchiveDropZone";
import { CommunityArchiveUserModal } from "./CommunityArchiveUserModal";
import { getCommunityArchiveUserProgressLabel } from "./CommunityArchiveUserProgress";

/**
 * The archive-loading actions shown in a view header: upload a .zip,
 * select from the Community Archive (with load progress), and the theme
 * toggle. Renders its own modal.
 */
export function ArchiveHeaderActions() {
  const { loadCommunityArchiveUserProgress } = useStore();
  const [showModal, setShowModal] = useState(false);
  const { appearance, toggleTheme } = useTheme();

  return (
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
      <CommunityArchiveUserModal
        showModal={showModal}
        setShowModal={setShowModal}
      />
    </>
  );
}
