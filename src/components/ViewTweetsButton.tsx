import type { Account } from "../types";

export const ViewTweetsButton = ({ account }: { account: Account }) => (
  <button
    type="button"
    onClick={() => {
      window.open(`#/all-tweets/?account_id=${account.accountId}`, "_blank");
    }}
    style={{
      marginLeft: 8,
      fontSize: 13,
      color: "#1769aa",
      background: "#e3f2fd",
      border: "1px solid #1976d2",
      padding: "3px 12px",
      borderRadius: "5px",
      textDecoration: "none",
      cursor: "pointer",
      transition: "background 0.15s, color 0.15s, border 0.15s",
    }}
    title="View tweets for this user"
  >
    View tweets
  </button>
);
