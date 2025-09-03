export function Sidebar() {
  return (
    <div
      style={{ width: "250px", borderRight: "1px solid #ccc", padding: "10px" }}
    >
      <h1>Tweet Archive Explorer</h1>
      <ul style={{ listStyleType: "none", padding: 0 }}>
        <li>All tweets</li>
        <li>Included 👍</li>
        <li>Excluded 👎</li>
        <li>Offensive 🤬</li>
        <li>NSFW 🔞</li>
        <li>Beef 🐄</li>
      </ul>
    </div>
  );
}
