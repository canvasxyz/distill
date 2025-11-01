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
      className="cursor-pointer text-[#255cdb] select-none font-bold"
    >
      {children}
    </span>
  );
};
