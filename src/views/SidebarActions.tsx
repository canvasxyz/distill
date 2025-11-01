import { useNavigate } from "react-router";
import { useStore } from "../state/store";

export const SidebarActions = () => {
  const navigate = useNavigate();
  const { clearDatabase, dbHasTweets } = useStore();

  return (
    <div
      style={{
        margin: "20px 18px",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
      }}
    >
      {dbHasTweets && (
        <button
          style={{
            display: "block",
            borderRadius: "5px",
            padding: "6px 16px",
            backgroundColor: "#e5f0ff",
            border: "1px solid #9bc1f799",
            fontSize: "16px",
            cursor: "pointer",
            color: "#194486",
          }}
          onClick={() => {
            navigate("/all-tweets");
          }}
        >
          View Tweets
        </button>
      )}

      {dbHasTweets && (
        <button
          style={{
            borderRadius: "5px",
            padding: "6px 16px",
            backgroundColor: "#f8d7da",
            border: "1px solid #f5c2c7",
            fontSize: "16px",
            cursor: "pointer",
            color: "#721c24",
          }}
          onClick={() => {
            const message =
              "Close the archive? You will have to fetch or upload these tweets again.";
            if (confirm(message)) clearDatabase();
          }}
        >
          Close Archive
        </button>
      )}
    </div>
  );
};
