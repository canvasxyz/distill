import type { ReactNode } from "react";

// Simple Modal component (no dependency on libraries)
export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  if (!open) return null;
  return (
    <div
      style={{
        position: "fixed",
        zIndex: 9999,
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        background: "rgba(0,0,0,0.25)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflowY: "auto",
      }}
      onClick={onClose}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
    >
      <div
        style={{
          minWidth: 340,
          maxWidth: 600,
          maxHeight: "calc(100vh - 80px)",
          background: "#fff",
          borderRadius: 10,
          padding: "24px 22px 18px 22px",
          boxShadow: "0 2px 32px 0 rgba(0,0,48,0.12)",
          position: "relative",
          overflowY: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 22,
          }}
        >
          <h2 style={{ fontSize: "1.25rem", margin: 0 }}>{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              background: "transparent",
              border: "none",
              fontSize: "1.45rem",
              cursor: "pointer",
              color: "#888",
              padding: 0,
              margin: 0,
              minWidth: 30,
            }}
            tabIndex={0}
          >
            ×
          </button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
}
