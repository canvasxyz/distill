import { useSelectedAccount } from "../hooks/useSelectedAccount";

export function AccountContextLine() {
  const { account, openPeople } = useSelectedAccount();
  return (
    <div className="account-context">
      {account ? (
        <>
          <button
            className="context-person"
            onClick={openPeople}
            aria-label={`Change person: @${account.username}`}
          >
            @{account.username} <span aria-hidden="true">⌄</span>
          </button>
          <span aria-hidden="true">·</span>
          {account.fromArchive ? (
            <span>Imported archive</span>
          ) : (
            <a
              href="https://www.community-archive.org/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Community Archive ↗
            </a>
          )}
        </>
      ) : (
        <span>Yourself, a friend, someone you’re curious about.</span>
      )}
    </div>
  );
}
