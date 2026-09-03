import { createContext, useContext } from "react";
import type { Account } from "../types";

export const SelectedAccountContext = createContext<{
  account: Account | null;
  selectedAccountId: string | null;
  setSelectedAccountId: (id: string | null) => void;
} | null>(null);

export function useSelectedAccount() {
  const context = useContext(SelectedAccountContext);
  if (!context) throw new Error("SelectedAccountProvider is missing");
  return context;
}
