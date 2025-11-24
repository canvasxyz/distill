import { useState, useRef } from "react";
import { Box } from "@radix-ui/themes";
import { useStore } from "../state/store";
import { archiveError, archiveLog, archiveWarn } from "../archiveUploadLogger";

export function ArchiveDropZone() {
  const { ingestTwitterArchive, ingestTwitterArchiveProgress } = useStore();
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      archiveLog("File selected for archive upload", {
        name: file.name,
        size: file.size,
        type: file.type,
      });
      try {
        await ingestTwitterArchive(file);
        archiveLog("Archive upload completed", { name: file.name });
      } catch (error) {
        archiveError("Archive upload failed", error);
        throw error;
      }
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.types.includes("Files")) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file && file.type === "application/zip") {
      archiveLog("File dropped for archive upload", {
        name: file.name,
        size: file.size,
      });
      try {
        await ingestTwitterArchive(file);
        archiveLog("Archive upload completed", { name: file.name });
      } catch (error) {
        archiveError("Archive upload failed", error);
        throw error;
      }
    } else if (file) {
      archiveWarn("Dropped file ignored (not a zip)", {
        name: file.name,
        type: file.type,
      });
    }
  };

  // Don't show drop zone when upload is in progress
  if (ingestTwitterArchiveProgress != null) {
    return null;
  }

  return (
    <>
      <Box
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={{
          height: "32px",
          fontSize: "0.88em",
          fontWeight: 600,
          color: "#2a89d1",
          padding: "3px 9px",
          border: "2.5px dashed #0090FF",
          borderColor: isDragging ? "var(--blue-10)" : "var(--blue-8)",
          borderRadius: "6px",
          backgroundColor: "transparent",
          cursor: "pointer",
          transition: "border-color 0.2s ease",
          flexShrink: 0,
          boxSizing: "border-box",
        }}
        title="Drop zip archive here or click to upload"
          >
        Upload .zip
      </Box>
      <input
        ref={fileInputRef}
        type="file"
        accept=".zip"
        onChange={handleFileUpload}
        style={{ display: "none" }}
      />
    </>
  );
}
