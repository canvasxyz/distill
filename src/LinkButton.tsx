import { NavLink } from "react-router";

const itemStyle = {
  border: "1px solid darkgray",
  borderRadius: "5px",
  padding: "5px",
  transition: "background-color 0.1s",
  textDecoration: "none",
  cursor: "pointer",
  color: "black",
};

const disabledItemStyle = {
  backgroundColor: "#f5f5f5",
  border: "1px solid darkgray",
  borderRadius: "5px",
  padding: "5px",
  textDecoration: "none",
  color: "#787878",
};

export const LinkButton = ({
  to,
  children,
  disabled,
}: {
  to: string;
  children: React.ReactNode;
  disabled?: boolean;
}) =>
  disabled ? (
    <div style={disabledItemStyle}>{children}</div>
  ) : (
    <NavLink
      to={to}
      style={({ isActive }) => ({
        ...itemStyle,
        backgroundColor: isActive ? "#d6d6d6" : "",
      })}
    >
      {children}
    </NavLink>
  );
