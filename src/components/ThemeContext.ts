import { createContext, useContext } from "react";

export type ThemeAppearance = "light" | "dark";

export interface ThemeContextType {
  appearance: ThemeAppearance;
  toggleTheme: () => void;
}

export const ThemeContext = createContext<ThemeContextType | undefined>(
  undefined,
);

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
