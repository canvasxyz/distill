import { ChatBubbleIcon } from "@radix-ui/react-icons";
import { Box, IconButton, Link, Tooltip } from "@radix-ui/themes";

export const FeedbackButtons = () => {
  return (
    <Box
      style={{
        position: "fixed",
        bottom: "18px",
        right: "24px",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        zIndex: 10,
      }}
    >
      <Tooltip content="Send feedback or get info">
        <Link
          href="https://docs.google.com/forms/d/e/1FAIpQLSdyfyXW0Kev9USSqr97FuIoZgXCqVebJsE7aj3kBWEw_xahRQ/viewform?usp=dialog"
          target="_blank"
          rel="noopener noreferrer"
          style={{ textDecoration: "none" }}
        >
          <IconButton
            variant="solid"
            color="indigo"
            size="3"
            radius="full"
          >
            <ChatBubbleIcon />
          </IconButton>
        </Link>
      </Tooltip>
    </Box>
  );
};
