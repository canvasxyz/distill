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

export const LinkButton = ({
  to,
  children,
}: {
  to: string;
  children: React.ReactNode;
}) => (
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
