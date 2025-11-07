export const BrowseMoreButton = ({
  onClick,
  isProcessing,
}: {
  onClick: () => void;
  isProcessing: boolean;
}) => (
  <div style={{ margin: "10px 0", textAlign: "center" }}>
    <a
      style={{
        display: "inline",
        color: "#0056B3cc",
        fontSize: "16px",
        cursor: isProcessing ? "not-allowed" : "pointer",
        opacity: isProcessing ? 0.6 : 1,
      }}
      onClick={onClick}
      onMouseEnter={(e) => {
        if (isProcessing) return;
        e.currentTarget.style.color = "#0056B3";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = "#0056B3cc";
      }}
    >
      More examples...
    </a>
  </div>
);
