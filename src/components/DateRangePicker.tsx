// Simple date range picker component
export function DateRangePicker({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  minDate,
  maxDate,
}: {
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  minDate?: string;
  maxDate?: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        gap: "10px",
        alignItems: "center",
        marginBottom: "10px",
      }}
    >
      <div>
        <label
          style={{ display: "block", fontSize: "14px", marginBottom: "4px" }}
        >
          From:
        </label>
        <input
          type="date"
          value={startDate}
          onChange={(e) => onStartDateChange(e.target.value)}
          min={minDate}
          max={maxDate}
          style={{
            padding: "6px",
            borderRadius: "4px",
            border: "1px solid #ccc",
            fontSize: "14px",
          }}
        />
      </div>
      <div>
        <label
          style={{ display: "block", fontSize: "14px", marginBottom: "4px" }}
        >
          To:
        </label>
        <input
          type="date"
          value={endDate}
          onChange={(e) => onEndDateChange(e.target.value)}
          min={minDate}
          max={maxDate}
          style={{
            padding: "6px",
            borderRadius: "4px",
            border: "1px solid #ccc",
            fontSize: "14px",
          }}
        />
      </div>
    </div>
  );
}
