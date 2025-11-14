import { useRef } from "react";
import { useStore } from "../state/store";
import { Box, Text, Button } from "@radix-ui/themes";

export const IngestArchive = ({
  variant = "default",
}: {
  variant?: "default" | "compact";
}) => {
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

  const progressLabel = ingestTwitterArchiveProgress
    ? ingestTwitterArchiveProgress.status === "processingArchive"
      ? "Processing archive..."
      : ingestTwitterArchiveProgress.status === "addingAccount"
        ? "Adding account"
        : ingestTwitterArchiveProgress.status === "addingProfile"
          ? "Adding profile"
          : ingestTwitterArchiveProgress.status === "addingTweets"
            ? "Adding tweets"
            : ingestTwitterArchiveProgress.status === "applyingFilters"
              ? "Applying filters"
              : ingestTwitterArchiveProgress.status === "generatingTextIndex"
                ? "Generating text index"
                : "Working..."
    : null;

  if (variant === "compact") {
    // Compact dropzone styled as button to match "Select from Community Archive"
    if (ingestTwitterArchiveProgress == null) {
      return (
        <Button
          type="button"
          color="blue"
          onClick={() => {
            fileInputRef.current?.click();
          }}
          onDragOver={(e) => {
            e.preventDefault();
            e.currentTarget.style.backgroundColor = "var(--blue-4)";
          }}
          onDragLeave={(e) => {
            e.currentTarget.style.backgroundColor = "";
          }}
          onDrop={async (e) => {
            e.preventDefault();
            e.currentTarget.style.backgroundColor = "";
            const file = e.dataTransfer.files[0];
            if (file && file.type === "application/zip") {
              await ingestTwitterArchive(file);
            }
          }}
        >
          Upload Twitter Archive (.zip)
          <input
            id="file-upload"
            ref={fileInputRef}
            type="file"
            accept=".zip"
            onChange={handleFileUpload}
            style={{ display: "none" }}
          />
        </Button>
      );
    }

    return (
      <Box
        style={{
          display: "inline-block",
          padding: "8px 12px",
          border: "2px dashed var(--sky-6)",
          borderRadius: "5px",
          backgroundColor: "var(--gray-2)",
          whiteSpace: "nowrap",
        }}
      >
        <Text size="3" weight="medium" color="gray">
          {progressLabel}
        </Text>
      </Box>
    );
  }

  // Default large dropzone
  return ingestTwitterArchiveProgress == null ? (
    <Box
      className="dropzone-hover"
      style={{
        textAlign: "center",
        marginTop: "20px",
        padding: "20px",
        border: "2px dashed var(--sky-9)",
        borderRadius: "5px",
        backgroundColor: "var(--gray-2)",
        cursor: "pointer",
      }}
      onClick={() => {
        fileInputRef.current?.click();
      }}
      onDragOver={(e) => {
        e.preventDefault();
        e.currentTarget.style.backgroundColor = "var(--gray-3)";
      }}
      onDragLeave={(e) => {
        e.currentTarget.style.backgroundColor = "var(--gray-2)";
      }}
      onDrop={async (e) => {
        e.preventDefault();
        e.currentTarget.style.backgroundColor = "var(--gray-2)";
        const file = e.dataTransfer.files[0];
        if (file && file.type === "application/zip") {
          await ingestTwitterArchive(file);
        }
      }}
    >
      <Text color="blue" style={{ margin: 0 }}>
        Drag and drop your Twitter archive (.zip) here or click to open.
      </Text>
      <input
        id="file-upload"
        ref={fileInputRef}
        type="file"
        accept=".zip"
        onChange={handleFileUpload}
        style={{ display: "none" }}
      />
    </Box>
  ) : (
    <Box
      style={{
        textAlign: "center",
        marginTop: "20px",
        padding: "20px",
        border: "2px dashed var(--sky-6)",
        borderRadius: "5px",
        backgroundColor: "var(--gray-2)",
      }}
    >
      <Text>{progressLabel}</Text>
    </Box>
  );
};
