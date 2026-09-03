import { Link } from "react-router";
import { useSelectedAccount } from "../hooks/useSelectedAccount";

export function AccountContextLine() {
  const { account } = useSelectedAccount();
  return (
    <div className="account-context">
      {account ? (
        <>
          <Link
            to={`/all-tweets?account_id=${encodeURIComponent(account.accountId)}`}
          >
            @{account.username}
          </Link>
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
