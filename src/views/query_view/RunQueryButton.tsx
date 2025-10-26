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
      style={{
        fontSize: "0.94em",
        padding: "6px 16px",
        borderRadius: "5px",
        border: "1px solid #007bff",
        background: disabled ? "#bfc9d1" : "#007bff",
        color: disabled ? "#6c757d" : "white",
        fontWeight: 500,
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "background 0.1s",
      }}
      onClick={disabled ? undefined : onClick}
      onMouseEnter={
        disabled
          ? undefined
          : (e) => (e.currentTarget.style.background = "#0056b3")
      }
      onMouseLeave={
        disabled
          ? undefined
          : (e) => (e.currentTarget.style.background = "#007bff")
      }
      disabled={disabled}
    >
      Run query
      {showShortcut && isMacPlatform && (
        <span style={{ marginLeft: 8, fontSize: "0.85em", opacity: 0.8 }}>
          ⌘⏎
        </span>
      )}
    </button>
  );
}
