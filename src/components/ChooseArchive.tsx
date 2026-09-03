import { useState } from "react";
import { useStore } from "../state/store";
import { CommunityArchiveUserModal } from "./CommunityArchiveUserModal";
import { ArchiveDropZone } from "./ArchiveDropZone";
import { getCommunityArchiveUserProgressLabel } from "./CommunityArchiveUserProgress";

export function ChooseArchive() {
  const [open, setOpen] = useState(false);
  const { loadCommunityArchiveUserProgress } = useStore();
  return (
    <div className="getting-started">
      <p>Start with an archive someone has shared, or bring your own.</p>
      <div className="choose-archive-actions">
        <button
          className="choose-person-button"
          onClick={() => setOpen(true)}
          disabled={!!loadCommunityArchiveUserProgress}
        >
          Choose someone ↗
        </button>
        <ArchiveDropZone />
      </div>
      {loadCommunityArchiveUserProgress && (
        <p role="status">
          {getCommunityArchiveUserProgressLabel(
            loadCommunityArchiveUserProgress,
          )}
        </p>
      )}
      <CommunityArchiveUserModal showModal={open} setShowModal={setOpen} />
    </div>
  );
}
