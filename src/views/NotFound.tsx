import { Box, Text, Button, IconButton } from "@radix-ui/themes";
import { useNavigate } from "react-router";
import { Header } from "../components/Header";
import { useTheme } from "../components/ThemeContext";

export function NotFound() {
  const navigate = useNavigate();
  const { appearance, toggleTheme } = useTheme();

  return (
    <Box style={{ width: "100%" }}>
      <Header
        leftContent={<div style={{ fontWeight: 600 }}>Distill Search</div>}
        rightContent={
          <IconButton
            onClick={toggleTheme}
            variant="outline"
            size="2"
            style={{ padding: "0 2px" }}
            title={
              appearance === "dark"
                ? "Switch to light theme"
                : "Switch to dark theme"
            }
          >
            {appearance === "dark" ? "☀️" : "🌙"}
          </IconButton>
        }
      />
      <Box
        style={{
          maxWidth: "800px",
          margin: "auto",
          width: "100%",
          boxSizing: "border-box",
          padding: "0 16px",
        }}
      >
        <Box mt="6" mb="4" style={{ textAlign: "center" }}>
          <Text size="9" weight="bold" style={{ display: "block" }}>
            404
          </Text>
          <Text
            size="6"
            weight="bold"
            style={{ display: "block", lineHeight: 2 }}
          >
            Page Not Found
          </Text>
          <Text size="3" style={{ lineHeight: 1.6, display: "block" }}>
            The page you're looking for doesn't exist or has been moved.
          </Text>
          <Button
            onClick={() => navigate("/")}
            size="3"
            variant="solid"
            style={{ marginTop: "16px" }}
          >
            Go Home
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
