import { Box, Text } from "@radix-ui/themes";

export function About() {
  return (
    <Box
      style={{
        maxWidth: "800px",
        margin: "auto",
        width: "100%",
        boxSizing: "border-box",
        padding: "0 16px",
      }}
    >
      <Box mt="6" mb="4">
        <Text size="6" weight="bold">
          About
        </Text>
      </Box>
      <Box style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <Text size="3" style={{ lineHeight: 1.6 }}>
          Distill is a tool for performing natural language queries on your 
          Twitter and X archives using AI.
        </Text>
      </Box>
    </Box>
  );
}

