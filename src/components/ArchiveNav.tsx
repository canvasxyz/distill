import { Link } from "react-router";
import { MoonIcon, SunIcon } from "@radix-ui/react-icons";
import { useTheme } from "./ThemeContext";
import { useState } from "react";
import { Modal } from "./Modal";
import { AboutContent } from "../views/About";

export function ArchiveNav() {
  const [aboutOpen, setAboutOpen] = useState(false);
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
        <button className="plain-button" onClick={() => setAboutOpen(true)}>
          What is this?
        </button>
        <button
          className="icon-button"
          onClick={toggleTheme}
          aria-label={themeLabel}
          title={themeLabel}
        >
          {appearance === "dark" ? <SunIcon /> : <MoonIcon />}
        </button>
      </div>
      <Modal
        open={aboutOpen}
        onClose={() => setAboutOpen(false)}
        title="What is this?"
      >
        <AboutContent />
      </Modal>
    </header>
  );
}
