import { useState } from "react";
import type { Account, Profile } from "../types";

export const UserSelectEntry = ({
  acc,
  profile,
  isActive,
  onClick,
  onClickRemove,
  numTweets,
  numRetweets,
}: {
  acc: Account;
  profile?: Profile;
  isActive: boolean;
  onClick: () => void;
  onClickRemove: () => void;
  numTweets: number;
  numRetweets: number;
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const size = 28;

  return (
    <div
      key={acc.accountId}
      onClick={onClick}
      style={{
        padding: "10px 12px",
        borderRadius: "6px",
        cursor: isActive ? "default" : "pointer",
        backgroundColor: isActive ? "#e3f2fd" : "#fff",
        border: isActive ? "1px solid #1976d2" : "1px solid #ddd",
        color: isActive ? "#1976d2" : "#333",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexGrow: "1",
      }}
      onMouseEnter={(e) => {
        setIsHovered(true);
        if (!isActive) {
          e.currentTarget.style.backgroundColor = "#f5f5f5";
        }
      }}
      onMouseLeave={(e) => {
        setIsHovered(false);
        if (!isActive) {
          e.currentTarget.style.backgroundColor = "#fff";
        }
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {profile && profile.avatarMediaUrl ? (
          <img
            src={profile.avatarMediaUrl}
            alt="avatar"
            width={size}
            height={size}
            style={{
              borderRadius: "50%",
              objectFit: "cover",
              flexShrink: 0,
              border: isActive ? "1px solid #1976d2" : "1px solid #ddd",
              background: "#fff",
            }}
          />
        ) : (
          <div
            style={{
              width: size,
              height: size,
              borderRadius: "50%",
              background: "#e0e0e0",
              border: isActive ? "1px solid #1976d2" : "1px solid #ddd",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#666",
              fontSize: 12,
              flexShrink: 0,
            }}
          >
            {(acc.username || acc.accountDisplayName || "?")
              .toUpperCase()
              .slice(0, 1)}
          </div>
        )}
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 8,
          }}
        >
          <span
            style={{
              fontWeight: 600,
              color: isActive ? "#1976d2" : "#555",
            }}
          >
            {acc.username || acc.accountDisplayName || acc.accountId}{" "}
            {acc.fromArchive && "(My archive)"}
          </span>
          <span style={{ color: isActive ? "#1565c0" : "#777" }}>
            {numTweets} tweets · {numRetweets} retweets
          </span>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {
          <button
            type="button"
            title="Remove archive"
            onClick={async (e) => {
              e.stopPropagation();
              onClickRemove();
            }}
            style={{
              width: 22,
              height: 22,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 11,
              border: "1px solid #ddd",
              background: "#fff",
              color: "#888",
              cursor: "pointer",
              opacity: isHovered ? 1 : 0,
              transition: "opacity 0.15s ease-in-out, background-color 0.2s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                "#f0f0f0";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                "#fff";
            }}
          >
            ×
          </button>
        }
      </div>
    </div>
  );
};
