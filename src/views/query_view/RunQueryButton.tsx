const isMacPlatform =
  typeof navigator !== "undefined" &&
  /macintosh|mac os x/i.test(navigator.userAgent);

export function RunQueryButton({
  onClick,
  disabled = false,
  showShortcut = false,
}: {
  onClick: () => void;
  disabled?: boolean;
  showShortcut?: boolean;
}) {
  return (
    <button
      className={`text-[0.94em] py-[6px] px-4 rounded-[5px] border border-blue-500 ${
        disabled
          ? "bg-[#bfc9d1] text-gray-600 cursor-not-allowed"
          : "bg-blue-500 text-white cursor-pointer hover:bg-[#0072ef]"
      } font-medium transition-colors duration-100`}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
    >
      Query
      {showShortcut && isMacPlatform && (
        <span className="ml-2 text-[0.85em] opacity-80">⌘⏎</span>
      )}
    </button>
  );
}
