import { Link } from "react-router";
import { MoonIcon, SunIcon } from "@radix-ui/react-icons";
import { useTheme } from "./ThemeContext";

export function ArchiveNav() {
  const { appearance, toggleTheme } = useTheme();
  const themeLabel =
    appearance === "dark" ? "Switch to light theme" : "Switch to dark theme";
  return (
    <header className="app-header">
      <Link to="/" className="wordmark" aria-label="Distill home">
        distill
        <span className="brand-dot" aria-hidden="true" />
      </Link>
      <span className="app-tagline">people are interesting.</span>
      <div className="app-header-actions">
        <Link to="/about">What is this?</Link>
        <button
          className="icon-button"
          onClick={toggleTheme}
          aria-label={themeLabel}
          title={themeLabel}
        >
          {appearance === "dark" ? <SunIcon /> : <MoonIcon />}
        </button>
      </div>
    </header>
  );
}
