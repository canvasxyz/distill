import { Flex } from "@radix-ui/themes";
import type { Account, ProfileWithId } from "../types";
import { UserSelectEntry } from "./UserSelectEntry";

export function UserSelectList({
  accounts,
  profilesById,
  selectedAccountId,
  setSelectedAccountId,
  removeArchive,
  countsByAccount,
  onSelect,
}: {
  accounts: Account[];
  profilesById: Record<string, ProfileWithId>;
  selectedAccountId: string | null;
  setSelectedAccountId: (accountId: string | null) => void;
  removeArchive: (accountId: string) => Promise<void>;
  countsByAccount: Map<string, { tweets: number; retweets: number }>;
  onSelect?: () => void;
}) {
  return (
    <Flex direction="column" gap="2px" p="0">
      {accounts.map((acc) => (
        <UserSelectEntry
          key={acc.accountId}
          acc={acc}
          profile={profilesById[acc.accountId]}
          onClick={() => {
            if (selectedAccountId === acc.accountId) {
              setSelectedAccountId(null);
            } else {
              setSelectedAccountId(acc.accountId);
            }
            onSelect?.();
          }}
          onClickRemove={async () => {
            const ok = window.confirm(
              "Remove this archive? This will delete the locally stored tweets and profile for this account.",
            );
            if (!ok) return;

            const idx = accounts.findIndex(
              (a) => a.accountId === acc.accountId,
            );
            const next =
              (idx >= 0 && accounts[idx + 1]) ||
              (idx > 0 && accounts[idx - 1]) ||
              null;

            await removeArchive(acc.accountId);

            if (selectedAccountId === acc.accountId && next?.accountId) {
              setSelectedAccountId(next.accountId);
            }
          }}
          isActive={
            selectedAccountId ? acc.accountId === selectedAccountId : false
          }
          numTweets={
            (countsByAccount.get(acc.accountId) || { tweets: 0 }).tweets
          }
          numRetweets={
            (countsByAccount.get(acc.accountId) || { retweets: 0 }).retweets
          }
        />
      ))}
    </Flex>
  );
}
