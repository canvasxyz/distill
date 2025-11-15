import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { Theme } from "@radix-ui/themes";

type ThemeAppearance = "light" | "dark";

interface ThemeContextType {
  appearance: ThemeAppearance;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = "app-theme";

function getInitialTheme(): ThemeAppearance {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === "light" || stored === "dark") {
      return stored;
    }
  } catch {
    // ignore storage errors
  }
  return "dark"; // default to dark
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [appearance, setAppearance] =
    useState<ThemeAppearance>(getInitialTheme);

  useEffect(() => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, appearance);
    } catch {
      // ignore storage errors
    }
  }, [appearance]);

  const toggleTheme = () => {
    setAppearance((prev) => (prev === "light" ? "dark" : "light"));
  };

  return (
    <ThemeContext.Provider value={{ appearance, toggleTheme }}>
      <Theme appearance={appearance} accentColor="blue">
        {children}
      </Theme>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
