export function RunQueryButton({
  onClick,
  disabled = false,
}: {
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      style={{
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
    </button>
  );
}
