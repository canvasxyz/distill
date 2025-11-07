import { useRef } from "react";
import { useStore } from "../state/store";

export const IngestArchive = () => {
  const { ingestTwitterArchive, ingestTwitterArchiveProgress } = useStore();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      await ingestTwitterArchive(file);
    }
  };

  return ingestTwitterArchiveProgress == null ? (
    <div
      style={{
        textAlign: "center",
        marginTop: "20px",
        padding: "20px",
        border: "2px dashed #007bff",
        borderRadius: "5px",
        backgroundColor: "#f9f9f9",
        cursor: "pointer",
        transition: "background-color 0.2s",
      }}
      onClick={() => {
        fileInputRef.current?.click();
      }}
      onDragOver={(e) => e.preventDefault()}
      onDrop={async (e) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file && file.type === "application/zip") {
          await ingestTwitterArchive(file);
        }
      }}
      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#e0e0e0")}
      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#f9f9f9")}
    >
      <p style={{ margin: "0", color: "#007bff" }}>
        Drag and drop your Twitter archive (.zip) here or click to open.
      </p>
      <input
        id="file-upload"
        ref={fileInputRef}
        type="file"
        accept=".zip"
        onChange={handleFileUpload}
        style={{ display: "none" }}
      />
    </div>
  ) : (
    <div
      style={{
        textAlign: "center",
        marginTop: "20px",
        padding: "20px",
        border: "2px dashed rgb(190, 222, 255)",
        borderRadius: "5px",
        backgroundColor: "#f9f9f9",
      }}
    >
      {ingestTwitterArchiveProgress.status === "processingArchive" &&
        "Processing archive..."}
      {ingestTwitterArchiveProgress.status === "addingAccount" &&
        "Adding account"}
      {ingestTwitterArchiveProgress.status === "addingProfile" &&
        "Adding profile"}
      {ingestTwitterArchiveProgress.status === "addingTweets" &&
        "Adding tweets"}
      {ingestTwitterArchiveProgress.status === "applyingFilters" &&
        "Applying filters"}
      {ingestTwitterArchiveProgress.status === "generatingTextIndex" &&
        "Generating text index"}
    </div>
  );
};
