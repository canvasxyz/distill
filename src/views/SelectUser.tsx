import { useLiveQuery } from "dexie-react-hooks";
import { Avatar } from "@radix-ui/themes";
import { db } from "../db";
import { useSelectedAccount } from "../hooks/useSelectedAccount";

export function SelectUser({ onOpen }: { onOpen?: () => void }) {
  const { account, openPeople } = useSelectedAccount();
  const profile = useLiveQuery(
    () =>
      account
        ? db.profiles.where("accountId").equals(account.accountId).first()
        : undefined,
    [account?.accountId],
  );
  return (
    <button
      className="selected-person"
      onClick={onOpen ?? openPeople}
      aria-label={
        account ? `Change person: @${account.username}` : "Choose a person"
      }
    >
      <Avatar
        src={profile?.avatarMediaUrl}
        size="2"
        radius="full"
        fallback={(account?.accountDisplayName || "?").slice(0, 1)}
      />
      <span className="selected-person-label">
        <span className="person-name">
          {account?.accountDisplayName || "Choose someone"}
        </span>
        <span className="person-handle">
          {account ? `@${account.username}` : "Yourself or someone else"}
        </span>
      </span>
      <span aria-hidden="true">⌄</span>
    </button>
  );
}
