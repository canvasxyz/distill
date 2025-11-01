import { useNavigate } from "react-router";
import { useStore } from "../state/store";

export const SidebarActions = () => {
  const navigate = useNavigate();
  const { clearDatabase } = useStore();

  return (
    <div className="m-5 flex flex-col gap-2.5">
      <button
        className="rounded-md border border-[#9bc1f7] bg-[#e5f0ff] px-4 py-1.5 text-base font-medium text-[#194486] shadow-sm transition hover:border-[#7aa9eb] hover:bg-[#d6e5ff] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7aa9eb]"
        onClick={() => {
          navigate("/all-tweets");
        }}
      >
        View Tweets
      </button>

      <button
        className="rounded-md border border-[#f5c2c7] bg-[#f8d7da] px-4 py-1.5 text-base font-medium text-[#721c24] shadow-sm transition hover:border-[#f28a94] hover:bg-[#f4c2c7] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f28a94]"
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
