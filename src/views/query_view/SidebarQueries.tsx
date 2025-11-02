import { useStore } from "../../state/store";
import { useNavigate, useLocation } from "react-router";
import type { QueryResult, RangeSelection } from "./ai_utils";
import type { ReactNode } from "react";
import {
  sidebarItemContainerBase,
  sidebarItemSubtitleBase,
  sidebarItemTitleBase,
} from "../sidebarStyles";

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

function SidebarItemContainer({
  children,
  isActive,
  onClick,
}: {
  children: ReactNode;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        ...sidebarItemContainerBase,
        background: isActive ? "#e3f2fd" : undefined,
      }}
      onMouseEnter={(e) => {
        if (!isActive) e.currentTarget.style.background = "#f7faff";
      }}
      onMouseLeave={(e) => {
        if (!isActive) e.currentTarget.style.background = "";
      }}
    >
      {children}
    </div>
  );
}

function PastQueryItem({ query }: { query: QueryResult }) {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = location.pathname === `/query/${query.id}`;

  return (
    <SidebarItemContainer
      isActive={isActive}
      onClick={() => navigate(`/query/${query.id}`)}
    >
      <span
        style={{
          ...sidebarItemTitleBase,
          color: isActive ? "#1976d2" : "#333",
        }}
      >
        {query.query.length > 80 ? query.query.slice(0, 80) + "…" : query.query}
      </span>
      <span style={sidebarItemSubtitleBase}>{formatDateTime(query.id)}</span>
    </SidebarItemContainer>
  );
}

function RunQueryItem() {
  const navigate = useNavigate();
  const location = useLocation();
  const isActive = location.pathname === "/";

  return (
    <SidebarItemContainer isActive={isActive} onClick={() => navigate("/")}>
      <span
        style={{
          ...sidebarItemTitleBase,
          color: isActive ? "#1976d2" : "#333",
        }}
      >
        Run Query
      </span>
      {/* empty second line to match PastQueryItem height */}
      <span style={sidebarItemSubtitleBase}></span>
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
