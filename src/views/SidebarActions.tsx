import { useNavigate } from "react-router";
import { useStore } from "../state/store";
import { itemContainerBase, itemTitleBase } from "./query_view/SidebarQueries";

export const SidebarActions = () => {
  const navigate = useNavigate();
  const { clearDatabase, dbHasTweets } = useStore();

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

      {dbHasTweets && (
        <div
          onClick={() => {
            const message =
              "Close the archive? You will have to fetch or upload these tweets again.";
            if (confirm(message)) clearDatabase();
          }}
          style={{
            ...itemContainerBase,
            marginBottom: 10,
            paddingBottom: 10,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#f8d7da77";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "";
          }}
        >
          <span
            style={{
              ...itemTitleBase,
              color: "#721c24",
            }}
          >
            Close Archive
          </span>
        </div>
      )}
    </div>
  );
};
