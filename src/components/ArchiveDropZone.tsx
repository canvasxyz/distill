import { useState, useRef } from "react";
import { Box } from "@radix-ui/themes";
import { useStore } from "../state/store";

export function ArchiveDropZone() {
  const { ingestTwitterArchive, ingestTwitterArchiveProgress } = useStore();
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      await ingestTwitterArchive(file);
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
      await ingestTwitterArchive(file);
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
          width: "54px",
          height: "36px",
          border: "3px dashed",
          borderColor: isDragging ? "var(--blue-10)" : "var(--blue-8)",
          borderRadius: "6px",
          backgroundColor: "transparent",
          cursor: "pointer",
          transition: "border-color 0.2s ease",
          flexShrink: 0,
          boxSizing: "border-box",
        }}
        title="Drop zip archive here or click to upload"
      />
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
