import { useState, useRef } from "react";
import { useStore } from "../state/store";

export function ArchiveDropZone() {
  const { ingestTwitterArchive, ingestTwitterArchiveProgress } = useStore();
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const importFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith(".zip")) {
      setError("Choose a Twitter/X archive .zip file.");
      return;
    }
    setError("");
    try {
      await ingestTwitterArchive(file);
    } catch {
      setError(
        "That archive couldn’t be imported. Check the .zip and try again.",
      );
      useStore.setState({ ingestTwitterArchiveProgress: null });
    }
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      await importFile(file);
    }
    event.target.value = "";
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
    if (file) {
      await importFile(file);
    }
  };

  // Don't show drop zone when upload is in progress
  if (ingestTwitterArchiveProgress != null) {
    return (
      <p className="sidebar-label" role="status">
        Importing your archive…
      </p>
    );
  }

  return (
    <>
      <button
        type="button"
        className={`archive-upload${isDragging ? " is-dragging" : ""}`}
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        title="Drop zip archive here or click to upload"
      >
        Import my archive ↗
      </button>
      {error && (
        <p role="alert" className="archive-upload-error">
          {error}
        </p>
      )}
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
