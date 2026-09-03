import { useEffect, useRef, useState, type ReactNode } from "react";
import { useStore } from "../state/store";
import { SelectedAccountContext } from "../hooks/useSelectedAccount";

const STORAGE_KEY = "llm:lastSelectedAccountId";

export function SelectedAccountProvider({ children }: { children: ReactNode }) {
  const { accounts, lastLoadedAccountId } = useStore();
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(
    () => {
      try {
        return localStorage.getItem(STORAGE_KEY);
      } catch {
        return null;
      }
    },
  );
  const lastAutoSelected = useRef<string | null>(null);

  useEffect(() => {
    if (!accounts.length) return;
    if (
      lastLoadedAccountId &&
      lastLoadedAccountId !== lastAutoSelected.current &&
      accounts.some((account) => account.accountId === lastLoadedAccountId)
    ) {
      setSelectedAccountId(lastLoadedAccountId);
      lastAutoSelected.current = lastLoadedAccountId;
    } else if (
      !accounts.some((account) => account.accountId === selectedAccountId)
    ) {
      setSelectedAccountId(accounts[0].accountId);
    }
  }, [accounts, lastLoadedAccountId, selectedAccountId]);

  useEffect(() => {
    if (!selectedAccountId) return;
    try {
      localStorage.setItem(STORAGE_KEY, selectedAccountId);
    } catch {
      // The selection still works when browser storage is unavailable.
    }
  }, [selectedAccountId]);

  const account =
    accounts.find((item) => item.accountId === selectedAccountId) ?? null;
  return (
    <SelectedAccountContext.Provider
      value={{
        account,
        selectedAccountId: account?.accountId ?? null,
        setSelectedAccountId,
      }}
    >
      {children}
    </SelectedAccountContext.Provider>
  );
}
