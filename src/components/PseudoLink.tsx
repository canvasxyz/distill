import type { ReactNode } from "react";

export const PseudoLink = ({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick: () => void;
}) => {
  return (
    <span
      onClick={onClick}
      style={{
        cursor: "pointer",
        color: "#255cdb",
        userSelect: "none",
        fontWeight: "bold",
      }}
    >
      {children}
    </span>
  );
};
