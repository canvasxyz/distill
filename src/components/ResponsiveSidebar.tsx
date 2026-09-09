import { useState } from "react";
import { NavLink } from "react-router";
import {
  ArrowRightIcon,
  ChatBubbleIcon,
  FaceIcon,
  GearIcon,
  HamburgerMenuIcon,
  Cross2Icon,
  ExternalLinkIcon,
} from "@radix-ui/react-icons";
import { PastQueries } from "../views/query_view/SidebarQueries";
import { useSelectedAccount } from "../hooks/useSelectedAccount";
import { useStore } from "../state/store";
import { SelectUser } from "../views/SelectUser";
import { getFetchPostsProgressLabel } from "./CommunityArchiveUserProgress";
import "./ResponsiveSidebar.css";

export function ResponsiveSidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { openPeople } = useSelectedAccount();
  const choosePerson = () => {
    setMobileOpen(false);
    openPeople();
  };
  const { fetchPostsProgress } = useStore();

  const sidebarContent = (
    <div className="sidebar-inner">
      <div>
        <p className="sidebar-label">Currently curious about</p>
        <SelectUser onOpen={choosePerson} />
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
      </nav>
      {fetchPostsProgress && (
        <p className="sidebar-label" role="status">
          {getFetchPostsProgressLabel(fetchPostsProgress)}
        </p>
      )}
      <section
        className="sidebar-recents"
        aria-label="Recent questions and avatars"
      >
        <div className="sidebar-recents-heading">
          <p className="sidebar-label">Recently</p>
          <NavLink
            to="/history"
            className="sidebar-see-all"
            aria-label="See all past questions and avatars"
            onClick={() => setMobileOpen(false)}
          >
            <span className="see-all-short">See all</span>
            <span className="see-all-long">Past questions & avatars</span>
            <ArrowRightIcon aria-hidden="true" />
          </NavLink>
        </div>
        <PastQueries onNavigate={() => setMobileOpen(false)} />
      </section>
      <div className="sidebar-bottom">
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
            Community Archive
            <ExternalLinkIcon className="inline-icon" aria-hidden="true" />
          </a>
        </footer>
      </div>
    </div>
  );

  return (
    <>
      <aside className="responsive-sidebar-desktop">{sidebarContent}</aside>
      <button
        className="mobile-sidebar-toggle icon-button"
        aria-label={mobileOpen ? "Close navigation" : "Open navigation"}
        aria-expanded={mobileOpen}
        aria-controls="mobile-navigation"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <Cross2Icon /> : <HamburgerMenuIcon />}
      </button>
      {mobileOpen && (
        <aside
          id="mobile-navigation"
          className="mobile-sidebar-content"
          aria-label="Navigation"
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setMobileOpen(false);
              document
                .querySelector<HTMLButtonElement>(".mobile-sidebar-toggle")
                ?.focus();
            }
          }}
        >
          {sidebarContent}
        </aside>
      )}
    </>
  );
}
