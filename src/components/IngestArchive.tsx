import { useRef } from "react";
import { useStore } from "../state/store";
import { Box, Text } from "@radix-ui/themes";

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
    // Compact dropzone with dashed border and reduced padding
    if (ingestTwitterArchiveProgress == null) {
      return (
        <Box
          style={{
            display: "inline-block",
            padding: "6px 12px",
            border: "2px dashed var(--sky-9)",
            borderRadius: "5px",
            backgroundColor: "var(--gray-2)",
            cursor: "pointer",
            transition: "background-color 0.2s",
            whiteSpace: "nowrap",
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
          onMouseEnter={(e) =>
            (e.currentTarget.style.backgroundColor = "var(--gray-3)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.backgroundColor = "var(--gray-2)")
          }
        >
          <Text size="3" weight="medium" color="blue">
            Upload Twitter Archive (.zip)
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
      style={{
        textAlign: "center",
        marginTop: "20px",
        padding: "20px",
        border: "2px dashed var(--blue-9)",
        borderRadius: "5px",
        backgroundColor: "var(--gray-2)",
        cursor: "pointer",
        transition: "background-color 0.2s",
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
      onMouseEnter={(e) =>
        (e.currentTarget.style.backgroundColor = "var(--gray-3)")
      }
      onMouseLeave={(e) =>
        (e.currentTarget.style.backgroundColor = "var(--gray-2)")
      }
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
        border: "2px dashed var(--blue-6)",
        borderRadius: "5px",
        backgroundColor: "var(--gray-2)",
      }}
    >
      <Text>{progressLabel}</Text>
    </Box>
  );
};
