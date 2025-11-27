import { useStore } from "../../state/store";
import { useNavigate, useLocation } from "react-router";
import type { QueryResult } from "./ai_utils";
import type { ReactNode } from "react";
import { useState, useRef, useEffect } from "react";
import { db } from "../../db";
import * as NavigationMenu from "@radix-ui/react-navigation-menu";
import {
  itemContainerBase,
  itemTitleBase,
} from "../../components/itemContainerBase";
import { Separator, Text, IconButton, Button } from "@radix-ui/themes";

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

// itemSubtitleBase is now handled by Text component with size="1"

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
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      onClick={onClick}
      className={`sidebar-item-container ${isActive ? "active" : ""}`}
      style={{
        ...itemContainerBase,
        position: "relative",
        background: isHovered || isActive ? "var(--gray-3)" : undefined,
      }}
      onMouseEnter={(e) => {
        setIsHovered(true);
        onMouseEnter?.(e);
      }}
      onMouseLeave={(e) => {
        setIsHovered(false);
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
  const path = `/query/${query.id}`;

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
    <NavigationMenu.Item value={query.id}>
      <SidebarItemContainer
        isActive={isActive}
        onClick={(e) => {
          // Don't navigate if clicking on the button or dropdown area
          const clickedOnButton = buttonRef.current?.contains(e.target as Node);
          const clickedOnDropdown = dropdownRef.current?.contains(
            e.target as Node,
          );

          if (!showDropdown && !clickedOnButton && !clickedOnDropdown) {
            navigate(path);
          }
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "4px",
            width: "100%",
            position: "relative",
            fontSize: "96%",
          }}
        >
          <span
            style={{
              ...itemTitleBase,
              color: "var(--gray-12)",
            }}
          >
            {query.query.length > 80
              ? query.query.slice(0, 80) + "…"
              : query.query}
          </span>
          {query.queriedHandle && (
            <Text size="1" color="gray">
              {query.queriedHandle}
            </Text>
          )}
          <Text size="1" color="gray">
            {formatDateTime(query.id)}
          </Text>
          <div
            style={{
              position: "absolute",
              top: "calc(50% - 14px)",
              right: "-5px",
            }}
          >
            <IconButton
              ref={buttonRef}
              onClick={(e) => {
                e.stopPropagation();
                setShowDropdown(!showDropdown);
              }}
              style={{
                display: isHovered ? "flex" : "none",
              }}
              variant="solid"
              color="gray"
              size="1"
              aria-label="More options"
            >
              ⋯
            </IconButton>
            {showDropdown && (
              <div
                ref={dropdownRef}
                style={{
                  position: "absolute",
                  top: "28px",
                  right: 0,
                  background: "var(--color-background)",
                  border: "1px solid var(--gray-6)",
                  borderRadius: "4px",
                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
                  zIndex: 1000,
                  minWidth: "120px",
                  overflow: "hidden",
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete();
                  }}
                  variant="outline"
                  color="red"
                  size="2"
                  style={{
                    width: "100%",
                    textAlign: "left",
                    justifyContent: "flex-start",
                  }}
                >
                  Delete
                </Button>
              </div>
            )}
          </div>
        </div>
      </SidebarItemContainer>
    </NavigationMenu.Item>
  );
}

function RunQueryItem() {
  const navigate = useNavigate();
  const location = useLocation();
  const isActive = location.pathname === "/";

  return (
    <NavigationMenu.Item value="run-query">
      <SidebarItemContainer
        isActive={isActive}
        onClick={() => navigate("/")}
        onMouseEnter={undefined}
        onMouseLeave={undefined}
      >
        <span
          style={{
            ...itemTitleBase,
            color: "var(--gray-12)",
            fontSize: "96%",
          }}
        >
          Archive Search
        </span>
        {/* empty second line to match PastQueryItem height */}
        <Text size="1" style={{ visibility: "hidden" }}>
          {" "}
        </Text>
      </SidebarItemContainer>
    </NavigationMenu.Item>
  );
}

function ArchiveChatItem() {
  const navigate = useNavigate();
  const location = useLocation();
  const isActive = location.pathname === "/chat";

  return (
    <NavigationMenu.Item value="archive-chat">
      <SidebarItemContainer
        isActive={isActive}
        onClick={() => navigate("/chat")}
        onMouseEnter={undefined}
        onMouseLeave={undefined}
      >
        <span
          style={{ ...itemTitleBase, color: "var(--gray-12)", fontSize: "96%" }}
        >
          Archive Chat
        </span>
        <Text size="1" style={{ visibility: "hidden" }}>
          {" "}
        </Text>
      </SidebarItemContainer>
    </NavigationMenu.Item>
  );
}

function SettingsItem() {
  const navigate = useNavigate();
  const location = useLocation();
  const isActive = location.pathname === "/settings";

  return (
    <NavigationMenu.Item value="settings">
      <SidebarItemContainer
        isActive={isActive}
        onClick={() => navigate("/settings")}
        onMouseEnter={undefined}
        onMouseLeave={undefined}
      >
        <span
          style={{ ...itemTitleBase, color: "var(--gray-12)", fontSize: "96%" }}
        >
          Settings
        </span>
        <Text size="1" style={{ visibility: "hidden" }}>
          {" "}
        </Text>
      </SidebarItemContainer>
    </NavigationMenu.Item>
  );
}

export function PastQueries() {
  const { queryResults } = useStore();

  const sortedQueries = queryResults ? [...queryResults].reverse() : [];

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <RunQueryItem />
      <ArchiveChatItem />
      <SettingsItem />
      {!queryResults || queryResults.length === 0 ? (
        <div style={{ padding: "20px 18px" }}>
          <Text size="2" color="gray" style={{ fontStyle: "italic" }}>
            No past queries yet
          </Text>
        </div>
      ) : (
        <Separator
          style={{ width: "100%", opacity: 0.4 }}
          mt="1"
          mb="2"
          color="gray"
        />
      )}
      {sortedQueries.map((query) => (
        <PastQueryItem key={query.id} query={query} />
      ))}
      <br />
    </div>
  );
}
