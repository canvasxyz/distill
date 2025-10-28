export function LoadingView() {
  return (
    <div
      style={{
        height: "100vh",
        width: "100vw",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#f7fafd",
        flexDirection: "column",
        gap: "24px",
      }}
    >
      <div
        style={{
          border: "8px solid #e0eafd",
          borderTop: "8px solid #4b90e2",
          borderRadius: "50%",
          width: "72px",
          height: "72px",
          animation: "spin 1.2s linear infinite",
        }}
      />
      <div style={{ fontSize: 22, color: "#26426a", fontWeight: 500 }}>
        Loading, please wait...
      </div>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg);}
            100% { transform: rotate(360deg);}
          }
        `}
      </style>
    </div>
  );
}
