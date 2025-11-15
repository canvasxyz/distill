import { IconButton } from "@radix-ui/themes";
import { useTheme } from "./ThemeProvider";

export function ThemeSwitcher() {
  const { appearance, toggleTheme } = useTheme();

  return (
    <IconButton
      onClick={toggleTheme}
      variant="ghost"
      size="3"
      style={{
        position: "fixed",
        bottom: "20px",
        right: "20px",
        zIndex: 1000,
        borderRadius: "50%",
        width: "48px",
        height: "48px",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
        backgroundColor: "transparent",
      }}
      title={appearance === "dark" ? "Switch to light theme" : "Switch to dark theme"}
    >
      {appearance === "dark" ? "☀️" : "🌙"}
    </IconButton>
  );
}

