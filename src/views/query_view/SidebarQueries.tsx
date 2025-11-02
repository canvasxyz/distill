import { useStore } from "../../state/store";
import { useNavigate, useLocation } from "react-router";
import type { QueryResult, RangeSelection } from "./ai_utils";
import type { CSSProperties, ReactNode } from "react";
import { useState, useRef, useEffect } from "react";
import { db } from "../../db";

function formatDateTime(dateStr?: string) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  return (
    d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    }) +
    " " +
    d.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    })
  );
}

function formatRangeSelection(rangeSelection?: RangeSelection) {
  if (!rangeSelection) return "latest tweets";
  return rangeSelection.type === "date-range"
    ? `${formatDateTime(rangeSelection.startDate)} - ${formatDateTime(
        rangeSelection.endDate,
      )}`
    : `latest ${rangeSelection.numTweets} tweets`;
}

// Shared styles for sidebar items
const itemContainerBase: CSSProperties = {
  cursor: "pointer",
  padding: "10px 18px 6px",
  display: "flex",
  flexDirection: "column",
  gap: "4px",
  transition: "background 0.12s",
};

const itemTitleBase: CSSProperties = {
  fontSize: "13px",
  wordBreak: "break-word",
};

const itemSubtitleBase: CSSProperties = {
  color: "#888",
  fontSize: "11px",
  fontWeight: 400,
};

function SidebarItemContainer({
  children,
  isActive,
  onClick,
  onMouseEnter,
  onMouseLeave,
}: {
  children: ReactNode;
  isActive: boolean;
  onClick: (e: React.MouseEvent<HTMLDivElement>) => void;
  onMouseEnter?: (e: React.MouseEvent<HTMLDivElement>) => void;
  onMouseLeave?: (e: React.MouseEvent<HTMLDivElement>) => void;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        ...itemContainerBase,
        background: isActive ? "#e3f2fd" : undefined,
        position: "relative",
      }}
      onMouseEnter={(e) => {
        if (!isActive) e.currentTarget.style.background = "#f7faff";
        onMouseEnter?.(e);
      }}
      onMouseLeave={(e) => {
        if (!isActive) e.currentTarget.style.background = "";
        onMouseLeave?.(e);
      }}
    >
      {children}
    </div>
  );
}

function PastQueryItem({ query }: { query: QueryResult }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [showDropdown, setShowDropdown] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const isActive = location.pathname === `/query/${query.id}`;

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    }

    if (showDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [showDropdown]);

  const handleDelete = async () => {
    const ok = confirm("Delete this query? This cannot be undone.");
    if (!ok) return;
    try {
      await db.queryResults.delete(query.id);
      setShowDropdown(false);
      // Navigate to home if we're currently viewing this query
      if (isActive) {
        navigate("/");
      }
    } catch (error) {
      console.error("Error deleting query:", error);
    }
  };

  return (
    <SidebarItemContainer
      isActive={isActive}
      onClick={(e) => {
        // Don't navigate if clicking on the button or dropdown area
        const clickedOnButton =
          buttonRef.current?.contains(e.target as Node);
        const clickedOnDropdown =
          dropdownRef.current?.contains(e.target as Node);
        
        if (!showDropdown && !clickedOnButton && !clickedOnDropdown) {
          navigate(`/query/${query.id}`);
        }
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          width: "100%",
          gap: "8px",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "4px",
            flex: 1,
            minWidth: 0,
          }}
        >
          <span
            style={{
              ...itemTitleBase,
              color: isActive ? "#1976d2" : "#333",
            }}
          >
            {query.query.length > 80
              ? query.query.slice(0, 80) + "…"
              : query.query}
          </span>
          <span style={itemSubtitleBase}>{formatDateTime(query.id)}</span>
        </div>
        <div
          style={{
            position: "relative",
            flexShrink: 0,
          }}
        >
          <button
            ref={buttonRef}
            onClick={(e) => {
              e.stopPropagation();
              setShowDropdown(!showDropdown);
            }}
            style={{
              display: isHovered ? "flex" : "none",
              alignItems: "center",
              justifyContent: "center",
              width: "24px",
              height: "24px",
              border: "none",
              background: "transparent",
              cursor: "pointer",
              borderRadius: "4px",
              padding: "4px",
              color: "#666",
              fontSize: "16px",
              lineHeight: 1,
              transition: "background 0.2s, color 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#e0e0e0";
              e.currentTarget.style.color = "#333";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "#666";
            }}
            aria-label="More options"
          >
            ⋯
          </button>
          {showDropdown && (
            <div
              ref={dropdownRef}
              style={{
                position: "absolute",
                top: "28px",
                right: 0,
                background: "#fff",
                border: "1px solid #ccc",
                borderRadius: "4px",
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
                zIndex: 1000,
                minWidth: "120px",
                overflow: "hidden",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete();
                }}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: "none",
                  background: "transparent",
                  textAlign: "left",
                  cursor: "pointer",
                  fontSize: "13px",
                  color: "#d32f2f",
                  transition: "background 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#f5f5f5";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                }}
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </div>
    </SidebarItemContainer>
  );
}

function RunQueryItem() {
  const navigate = useNavigate();
  const location = useLocation();
  const isActive = location.pathname === "/";

  return (
    <SidebarItemContainer
      isActive={isActive}
      onClick={() => navigate("/")}
      onMouseEnter={undefined}
      onMouseLeave={undefined}
    >
      <span
        style={{
          ...itemTitleBase,
          color: isActive ? "#1976d2" : "#333",
        }}
      >
        Run Query
      </span>
      {/* empty second line to match PastQueryItem height */}
      <span style={itemSubtitleBase}></span>
    </SidebarItemContainer>
  );
}

export function PastQueries() {
  const { queryResults } = useStore();

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
      }}
    >
      <RunQueryItem />
      {(!queryResults || queryResults.length === 0) && (
        <div
          style={{
            padding: "20px 18px",
            color: "#888",
            fontSize: "13px",
            fontStyle: "italic",
          }}
        >
          No past queries yet
        </div>
      )}
      {queryResults.map((query) => (
        <PastQueryItem key={query.id} query={query} />
      ))}
    </div>
  );
}
