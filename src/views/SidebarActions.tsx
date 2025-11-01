import { useNavigate } from "react-router";
import { useStore } from "../state/store";

export const SidebarActions = () => {
  const navigate = useNavigate();
  const { clearDatabase } = useStore();

  return (
    <div className="m-[20px_18px] flex flex-col gap-[10px]">
      <button
        className="block rounded-[5px] py-[6px] px-4 bg-[#e5f0ff] border border-[#9bc1f799] text-base cursor-pointer text-[#194486]"
        onClick={() => {
          navigate("/all-tweets");
        }}
      >
        View Tweets
      </button>

      <button
        className="rounded-[5px] py-[6px] px-4 bg-[#f8d7da] border border-[#f5c2c7] text-base cursor-pointer text-[#721c24]"
        onClick={() => {
          const message =
            "Close the archive? You will have to fetch or upload these tweets again.";
          if (confirm(message)) clearDatabase();
        }}
      >
        Close Archive
      </button>
    </div>
  );
};
