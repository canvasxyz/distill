export function AnalyzeTweetsButton({
  canAnalyse,
  onClick,
}: {
  canAnalyse: boolean;
  onClick: () => void;
}) {
  return (
    <button
      style={{
        borderRadius: "10px",
        padding: "10px 18px",
        border: canAnalyse ? "1.5px solid #3dbb63" : "1.5px solid #b6dfc3",
        background: canAnalyse
          ? "linear-gradient(90deg, #e6faee 60%, #baf9d7 100%)"
          : "linear-gradient(90deg, #f4faf5 80%, #eaf7f1 100%)",
        color: canAnalyse ? "#21733b" : "#b7cdb9",
        fontWeight: 600,
        fontSize: "1em",
        cursor: canAnalyse ? "pointer" : "not-allowed",
        boxShadow: canAnalyse ? "0 2px 8px 0px rgba(35,180,90,0.14)" : "none",
        transition:
          "background 0.18s, color 0.14s, border 0.14s, box-shadow 0.14s",
        outline: "none",
        opacity: canAnalyse ? 1 : 0.7,
        position: "relative",
        overflow: "hidden",
      }}
      onMouseEnter={(e) => {
        if (canAnalyse)
          e.currentTarget.style.background =
            "linear-gradient(90deg, #cbefdc 60%, #87e2ad 100%)";
      }}
      onMouseLeave={(e) => {
        if (canAnalyse)
          e.currentTarget.style.background =
            "linear-gradient(90deg, #e6faee 60%, #baf9d7 100%)";
      }}
      onClick={onClick}
      disabled={!canAnalyse}
    >
      <span
        style={{
          filter: "drop-shadow(0 0 2px #87e2ad)",
          marginRight: "8px",
          fontSize: "1.10em",
          verticalAlign: "-2px",
        }}
      >
        ⚡
      </span>
      Analyze Tweets
    </button>
  );
}
