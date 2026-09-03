import { useState } from "react";
import { NavLink } from "react-router";
import { Dialog } from "@radix-ui/themes";
import {
  ChatBubbleIcon,
  FaceIcon,
  CounterClockwiseClockIcon,
  PersonIcon,
  GearIcon,
  HamburgerMenuIcon,
  Cross2Icon,
} from "@radix-ui/react-icons";
import { PastQueries } from "../views/query_view/SidebarQueries";
import { useSelectedAccount } from "../hooks/useSelectedAccount";
import { useStore } from "../state/store";
import { SelectUser } from "../views/SelectUser";
import { ArchiveDropZone } from "./ArchiveDropZone";
import { CommunityArchiveUserModal } from "./CommunityArchiveUserModal";
import { getCommunityArchiveUserProgressLabel } from "./CommunityArchiveUserProgress";
import "./ResponsiveSidebar.css";

export function ResponsiveSidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [peopleOpen, setPeopleOpen] = useState(false);
  const { selectedAccountId, setSelectedAccountId } = useSelectedAccount();
  const { appIsReady, loadCommunityArchiveUserProgress } = useStore();

  const sidebarContent = (
    <div className="sidebar-inner">
      <div>
        <p className="sidebar-label">Currently curious about</p>
        <SelectUser
          selectedAccountId={selectedAccountId}
          setSelectedAccountId={setSelectedAccountId}
        />
      </div>
      <nav
        className="primary-nav"
        aria-label="Main navigation"
        onClick={(event) => {
          if ((event.target as HTMLElement).closest("a")) setMobileOpen(false);
        }}
      >
        <NavLink to="/" end>
          <ChatBubbleIcon />
          Ask something
        </NavLink>
        <NavLink to="/avatar">
          <FaceIcon />
          Make an avatar
        </NavLink>
        <NavLink to="/history">
          <CounterClockwiseClockIcon />
          Past questions
        </NavLink>
        <button
          disabled={!appIsReady || !!loadCommunityArchiveUserProgress}
          onClick={() => {
            setMobileOpen(false);
            setPeopleOpen(true);
          }}
        >
          <PersonIcon />
          Someone else
        </button>
      </nav>
      {loadCommunityArchiveUserProgress && (
        <p className="sidebar-label" role="status">
          {getCommunityArchiveUserProgressLabel(
            loadCommunityArchiveUserProgress,
          )}
        </p>
      )}
      <section className="sidebar-recents" aria-label="Recent questions">
        <p className="sidebar-label">Last time you asked</p>
        <PastQueries onNavigate={() => setMobileOpen(false)} />
      </section>
      <div className="sidebar-bottom">
        <ArchiveDropZone />
        <NavLink
          className="settings-link"
          to="/settings"
          onClick={() => setMobileOpen(false)}
        >
          <GearIcon />
          Settings
        </NavLink>
        <footer className="sidebar-attribution">
          <a
            href="https://www.community-archive.org/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Made possible by
            <br />
            Community Archive ↗
          </a>
          <p>
            Built by{" "}
            <a
              href="https://github.com/raykyri"
              target="_blank"
              rel="noopener noreferrer"
            >
              raykyri
            </a>{" "}
            and{" "}
            <a
              href="https://github.com/rjwebb"
              target="_blank"
              rel="noopener noreferrer"
            >
              rjwebb
            </a>
            <br />
            <a
              href="http://canvas.xyz"
              target="_blank"
              rel="noopener noreferrer"
            >
              Canvas Technologies Inc
            </a>
          </p>
        </footer>
      </div>
    </div>
  );

  return (
    <>
      <aside className="responsive-sidebar-desktop">{sidebarContent}</aside>
      <Dialog.Root open={mobileOpen} onOpenChange={setMobileOpen}>
        <Dialog.Trigger>
          <button
            className="mobile-sidebar-toggle icon-button"
            aria-label="Open navigation"
          >
            <HamburgerMenuIcon />
          </button>
        </Dialog.Trigger>
        <Dialog.Content
          className="mobile-sidebar-content"
          aria-describedby={undefined}
        >
          <div className="mobile-sidebar-heading">
            <Dialog.Title>Distill</Dialog.Title>
            <Dialog.Close>
              <button className="icon-button" aria-label="Close navigation">
                <Cross2Icon />
              </button>
            </Dialog.Close>
          </div>
          {sidebarContent}
        </Dialog.Content>
      </Dialog.Root>
      <CommunityArchiveUserModal
        showModal={peopleOpen}
        setShowModal={setPeopleOpen}
      />
    </>
  );
}
