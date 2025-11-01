import { useNavigate } from "react-router";
import { useStore } from "../state/store";
import { Button } from "@radix-ui/themes";

export const SidebarActions = () => {
  const navigate = useNavigate();
  const { clearDatabase } = useStore();

  return (
    <div
      style={{
        margin: "20px 18px",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
      }}
    >
      <Button
        variant="soft"
        color="blue"
        onClick={() => {
          navigate("/all-tweets");
        }}
        style={{ cursor: "pointer" }}
      >
        View Tweets
      </Button>

      <Button
        variant="soft"
        color="red"
        onClick={() => {
          const message =
            "Close the archive? You will have to fetch or upload these tweets again.";
          if (confirm(message)) clearDatabase();
        }}
        style={{ cursor: "pointer" }}
      >
        Close Archive
      </Button>
    </div>
  );
};
