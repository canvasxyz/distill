import type { ReactNode } from "react";

export const FeaturedQueryCard = ({
  children,
  isProcessing,
}: {
  children: ReactNode;
  isProcessing: boolean;
}) => (
  <div
    style={{
      padding: "16px",
      background: "#f8f9fa",
      color: "#212529",
      border: "1px solid #ddd",
      borderRadius: "6px",
      fontSize: "15px",
      fontWeight: 500,
      boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
      transition: "background 0.2s, color 0.2s",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "space-between",
      textAlign: "center",
      minHeight: "140px",
      gap: "12px",
      opacity: isProcessing ? 0.6 : 1,
    }}
  >
    {children}
  </div>
);
