import { NavLink } from "react-router";
import React, { useRef, useCallback } from "react";

const itemStyle = {
  background: "#f7fafc",
  borderRadius: "4px",
  padding: "10px 18px",
  transition: "background 0.18s, color 0.14s, box-shadow 0.16s",
  textDecoration: "none",
  cursor: "pointer",
  color: "#345388",
  fontWeight: 600,
  fontSize: "1em",
  boxShadow: "0 1.5px 6px 0px rgba(120, 150, 200, 0.08)",
  outline: "none",
};

const hoverBackground = "#eaf4fc";

const disabledItemStyle = {
  background: "#f3f5fa",
  border: "1px solid #e2e6ef",
  borderRadius: "12px",
  padding: "10px 18px",
  textDecoration: "none",
  color: "#b5bacf",
  fontWeight: 600,
  fontSize: "1em",
  cursor: "not-allowed",
  opacity: 0.85,
};

export const LinkButton = ({
  to,
  children,
  disabled,
}: {
  to: string;
  children: React.ReactNode;
  disabled?: boolean;
}) => {
  const linkRef = useRef<HTMLAnchorElement>(null);

  const handleMouseEnter = useCallback(() => {
    if (linkRef.current) {
      linkRef.current.style.background = hoverBackground;
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (linkRef.current) {
      linkRef.current.style.background = "#f7fafc";
    }
  }, []);

  if (disabled) {
    return <div style={disabledItemStyle}>{children}</div>;
  }

  return (
    <NavLink
      to={to}
      style={({ isActive }) => ({
        ...itemStyle,
        background: isActive ? "#e3ebfb" : itemStyle.background,
        color: isActive ? "#203d65" : itemStyle.color,
        boxShadow: isActive
          ? "0 1.5px 8px 0px rgba(92, 132, 205, 0.11)"
          : itemStyle.boxShadow,
      })}
      ref={linkRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </NavLink>
  );
};
