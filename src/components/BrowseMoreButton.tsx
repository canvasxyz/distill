import { Box, Link, Text } from "@radix-ui/themes";

export const BrowseMoreButton = ({
  onClick,
  isProcessing,
}: {
  onClick: () => void;
  isProcessing: boolean;
}) => (
  <Box style={{ margin: "10px 0", textAlign: "center" }}>
    {isProcessing ? (
      <Text
        size="3"
        style={{ opacity: isProcessing ? 0.6 : 1, cursor: "not-allowed" }}
      >
        More examples...
      </Text>
    ) : (
      <Link
        onClick={onClick}
        style={{
          cursor: isProcessing ? "not-allowed" : "pointer",
          opacity: isProcessing ? 0.6 : 1,
        }}
      >
        <Text size="3">More examples...</Text>
      </Link>
    )}
  </Box>
);
