import { useNavigate } from "react-router";
import { useStore } from "../state/store";
import {
  itemContainerBase,
  itemTitleBase,
} from "../components/itemContainerBase";

export const SidebarActions = () => {
  const navigate = useNavigate();
  const { dbHasTweets, accounts } = useStore();

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
      }}
    >
      {dbHasTweets && (
        <div
          onClick={() => {
            navigate("/all-tweets");
          }}
          style={{
            ...itemContainerBase,
            marginTop: 10,
            paddingBottom: 10,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#f7faff";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "";
          }}
        >
          <span
            style={{
              ...itemTitleBase,
              color: "#194486",
            }}
          >
            View Tweets
          </span>
        </div>
      )}

      {dbHasTweets && accounts.length > 0 && (
        <div
          onClick={() => {
            navigate("/switch-account");
          }}
          style={{
            display: "flex",
            justifyContent: "space-between",
            cursor: "pointer",
            ...itemContainerBase,
            marginBottom: 10,
            paddingBottom: 10,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#f7faff";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "";
          }}
        >
          <span
            style={{
              ...itemTitleBase,
              color: "#194486",
            }}
          >
            Switch Account
          </span>
        </div>
      )}
    </div>
  );
};
