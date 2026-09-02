import { useState, useEffect } from "react";
import { Box, Link, IconButton, Text } from "@radix-ui/themes";
import * as Dialog from "@radix-ui/react-dialog";
import * as NavigationMenu from "@radix-ui/react-navigation-menu";
import { useNavigate, useLocation } from "react-router";
import { PastQueries } from "../views/query_view/SidebarQueries";
import { Header } from "./Header";
import { useTheme } from "./ThemeContext";
import "./ResponsiveSidebar.css";

function AttributionFooter() {
  return (
    <Box className="sidebar-attribution" aria-label="Creator attribution">
      <Text as="p" size="1" color="gray" m="0">
        Built by{" "}
        <Link
          href="https://github.com/raykyri"
          target="_blank"
          rel="noopener noreferrer"
        >
          raykyri
        </Link>{" "}
        and{" "}
        <Link
          href="https://github.com/rjwebb"
          target="_blank"
          rel="noopener noreferrer"
        >
          rjwebb
        </Link>{" "}
        <span aria-hidden="true">·</span>{" "}
        <Link
          href="http://canvas.xyz"
          target="_blank"
          rel="noopener noreferrer"
        >
          Canvas Technologies Inc
        </Link>
      </Text>
    </Box>
  );
}

export function ResponsiveSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { appearance } = useTheme();

  const boxShadowColor =
    appearance === "dark" ? "rgba(255, 255, 255, 0.04)" : "rgba(0, 0, 0, 0.04)";

  // Close mobile sidebar when location changes
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const sidebarContent = (
    <NavigationMenu.Root
      orientation="vertical"
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        width: "100%",
      }}
    >
      <Header
        leftContent={
          <Link
            onClick={() => {
              navigate("/");
              setMobileOpen(false);
            }}
            style={{
              cursor: "pointer",
              fontSize: 24,
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              lineHeight: 1,
            }}
          >
            🔎
          </Link>
        }
        justifyContent="flex-start"
        reserveFloatingNavSpace={false}
      />
      <NavigationMenu.List
        style={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          overflowX: "hidden",
          listStyle: "none",
          margin: 0,
          padding: 0,
        }}
      >
        <Box style={{ flex: 1, overflow: "visible" }}>
          <PastQueries />
        </Box>
      </NavigationMenu.List>
      <AttributionFooter />
    </NavigationMenu.Root>
  );

  return (
    <>
      {/* Desktop Sidebar - visible on larger screens */}
      <Box
        className="responsive-sidebar-desktop"
        style={{
          minWidth: 220,
          maxWidth: 220,
          position: "sticky",
          top: 0,
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          boxShadow: `2px 0 1px ${boxShadowColor}`,
        }}
      >
        {sidebarContent}
      </Box>

      {/* Mobile Hamburger Button - fixed at bottom left */}
      <IconButton
        className="mobile-sidebar-toggle"
        onClick={() => setMobileOpen(true)}
        aria-label="Open sidebar"
        variant="soft"
        size="3"
        style={{
          position: "fixed",
          bottom: "24px",
          left: "24px",
          width: "56px",
          height: "56px",
          borderRadius: "50%",
        }}
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <line x1="3" y1="12" x2="21" y2="12"></line>
          <line x1="3" y1="18" x2="21" y2="18"></line>
        </svg>
      </IconButton>

      {/* Mobile Sidebar Overlay - using Radix Dialog */}
      <Dialog.Root open={mobileOpen} onOpenChange={setMobileOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="mobile-sidebar-overlay" />
          <Dialog.Content className="mobile-sidebar-content">
            <Box
              style={{
                width: "100%",
                height: "100%",
                overflow: "hidden",
                borderRight: "1px solid var(--gray-6)",
              }}
            >
              {sidebarContent}
            </Box>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
