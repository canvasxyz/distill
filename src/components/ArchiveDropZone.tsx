import { useState } from "react";
import { Box } from "@radix-ui/themes";
import { useStore } from "../state/store";

export function ArchiveDropZone() {
  const { ingestTwitterArchive, ingestTwitterArchiveProgress } = useStore();
  const [isDragging, setIsDragging] = useState(false);

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
      await ingestTwitterArchive(file);
    }
  };

  // Don't show drop zone when upload is in progress
  if (ingestTwitterArchiveProgress != null) {
    return null;
  }

  return (
    <Box
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{
        width: "60px",
        height: "36px",
        border: "3px dashed",
        borderColor: isDragging ? "var(--blue-9)" : "var(--blue-7)",
        borderRadius: "6px",
        backgroundColor: "transparent",
        cursor: "pointer",
        transition: "border-color 0.2s ease",
        flexShrink: 0,
      }}
      title="Drop zip archive here"
    />
  );
}
