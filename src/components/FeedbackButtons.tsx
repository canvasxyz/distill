import { Box, Link, Button } from "@radix-ui/themes";

export const FeedbackButtons = () => {
  return (
    <Box
      style={{
        position: "fixed",
        bottom: "18px",
        right: "24px",
        zIndex: 1000,
      }}
    >
      <Link
        href="https://docs.google.com/forms/d/e/1FAIpQLSdyfyXW0Kev9USSqr97FuIoZgXCqVebJsE7aj3kBWEw_xahRQ/viewform?usp=dialog"
        target="_blank"
        rel="noopener noreferrer"
        title="Send feedback or get info"
      >
        <Button variant="soft" size="2">
          💬
        </Button>
      </Link>
    </Box>
  );
};
