import { Link } from "@radix-ui/themes";
import type { ReactNode } from "react";

export const PseudoLink = ({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick: () => void;
}) => {
  return (
    <Link
      href="#"
      underline="always"
      weight="bold"
      color="indigo"
      onClick={(event) => {
        event.preventDefault();
        onClick();
      }}
      style={{ cursor: "pointer", userSelect: "none" }}
    >
      {children}
    </Link>
  );
};
