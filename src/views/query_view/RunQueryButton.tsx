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
      className="rounded-md border border-[#007bff] bg-[#007bff] px-4 py-1.5 text-sm font-medium text-white transition hover:bg-[#0072ef] disabled:cursor-not-allowed disabled:border-slate-300 disabled:bg-slate-300 disabled:text-slate-500"
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
    >
      Query
      {showShortcut && isMacPlatform && (
        <span className="ml-2 text-xs opacity-80">⌘⏎</span>
      )}
    </button>
  );
}
