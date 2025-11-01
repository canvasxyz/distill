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
      className="cursor-pointer select-none font-semibold text-indigo-600 transition hover:text-indigo-700"
    >
      {children}
    </span>
  );
};
