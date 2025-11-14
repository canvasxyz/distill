import { Box, Flex, Text } from "@radix-ui/themes";

export function LoadingView() {
  return (
    <Box
      style={{
        position: "fixed",
        height: "100vh",
        width: "100vw",
        background: "var(--gray-2)",
      }}
    >
      <Flex
        direction="column"
        align="center"
        justify="center"
        gap="6"
        style={{ height: "100%" }}
      >
        <Box
          style={{
            border: "8px solid var(--sky-4)",
            borderTop: "8px solid var(--sky-9)",
            borderRadius: "50%",
            width: "72px",
            height: "72px",
            animation: "spin 1.2s linear infinite",
          }}
        />
        <Text size="5" weight="medium" color="gray">
          Loading, please wait...
        </Text>
        <style>
          {`
            @keyframes spin {
              0% { transform: rotate(0deg);}
              100% { transform: rotate(360deg);}
            }
          `}
        </style>
      </Flex>
    </Box>
  );
}
