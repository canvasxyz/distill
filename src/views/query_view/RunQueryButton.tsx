export function RunQueryButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      style={{
        padding: "6px 16px",
        borderRadius: "5px",
        border: "1px solid #007bff",
        background: "#007bff",
        color: "white",
        fontWeight: 500,
        cursor: "pointer",
        transition: "background 0.1s",
      }}
      onClick={onClick}
      onMouseEnter={(e) => (e.currentTarget.style.background = "#0056b3")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "#007bff")}
      // onClick handler to be implemented
    >
      Run query
    </button>
  );
}
