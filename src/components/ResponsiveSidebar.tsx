import { useState, useEffect } from "react";
import { Box, Flex, Link } from "@radix-ui/themes";
import * as Dialog from "@radix-ui/react-dialog";
import { useNavigate, useLocation } from "react-router";
import { PastQueries } from "../views/query_view/SidebarQueries";
import "./ResponsiveSidebar.css";

export function ResponsiveSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile sidebar when location changes
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const sidebarContent = (
    <Flex direction="column" style={{ height: "100%" }}>
      <Box p="4" pb="3">
        <Link
          onClick={() => {
            navigate("/");
            setMobileOpen(false);
          }}
          style={{
            cursor: "pointer",
            fontSize: 32,
            textDecoration: "none",
          }}
        >
          💧
        </Link>
      </Box>
      <Box style={{ flex: 1 }}>
        <PastQueries />
      </Box>
    </Flex>
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
          overflowY: "auto",
          borderRight: "1px solid var(--gray-6)",
        }}
      >
        {sidebarContent}
      </Box>

      {/* Mobile Hamburger Button - fixed at bottom left */}
      <button
        className="mobile-sidebar-toggle"
        onClick={() => setMobileOpen(true)}
        aria-label="Open sidebar"
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
      </button>

      {/* Mobile Sidebar Overlay - using Radix Dialog */}
      <Dialog.Root open={mobileOpen} onOpenChange={setMobileOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="mobile-sidebar-overlay" />
          <Dialog.Content className="mobile-sidebar-content">
            <Box
              style={{
                width: "100%",
                height: "100%",
                overflowY: "auto",
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
