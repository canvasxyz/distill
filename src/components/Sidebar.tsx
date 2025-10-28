import { LinkButton } from "./LinkButton";
import { useStore } from "../state/store";

export function Sidebar() {
  const { viewingMyArchive } = useStore();

  return (
    <div
      style={{
        width: "210px",
        borderRight: "1px solid #ddd",
        padding: "10px",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <LinkButton to="/" size="lg">
          Archive Explorer
        </LinkButton>
        <LinkButton to="/all-tweets" disabled={!viewingMyArchive} size="lg">
          Archive Review
        </LinkButton>
      </div>
      {/* Floating Feedback button at the bottom-left of the sidebar */}
      <a
        href="https://docs.google.com/forms/d/e/1FAIpQLSdyfyXW0Kev9USSqr97FuIoZgXCqVebJsE7aj3kBWEw_xahRQ/viewform?usp=dialog"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          position: "fixed",
          left: "10px",
          bottom: "60px",
          display: "inline-block",
          background: "#f7fafc",
          borderRadius: "4px",
          padding: "10px 18px",
          textDecoration: "none",
          cursor: "pointer",
          color: "#345388",
          fontWeight: 600,
          fontSize: "1em",
          boxShadow: "0 1.5px 6px 0px rgba(120, 150, 200, 0.08)",
          outline: "none",
          border: "1px solid #e2e6ef",
          zIndex: 1000,
        }}
        title="Send feedback or get info"
      >
        Send Feedback
      </a>
      <a
        href="https://docs.google.com/forms/d/e/1FAIpQLSdyfyXW0Kev9USSqr97FuIoZgXCqVebJsE7aj3kBWEw_xahRQ/viewform?usp=dialog"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          position: "fixed",
          left: "10px",
          bottom: "12px",
          display: "inline-block",
          background: "#f7fafc",
          borderRadius: "4px",
          padding: "10px 18px",
          textDecoration: "none",
          cursor: "pointer",
          color: "#345388",
          fontWeight: 600,
          fontSize: "1em",
          boxShadow: "0 1.5px 6px 0px rgba(120, 150, 200, 0.08)",
          outline: "none",
          border: "1px solid #e2e6ef",
          zIndex: 1000,
        }}
        title="Send feedback or get info"
      >
        Subscribe to Updates
      </a>
    </div>
  );
}
