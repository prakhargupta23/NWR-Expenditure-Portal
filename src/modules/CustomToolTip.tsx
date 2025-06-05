interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: any;
  hoveredSeries: string | null;
  isPinned: boolean;
  pinnedEntry: any;
  pinnedLabel: string | null;
  setIsPinned: (v: boolean) => void;
  varianceData?: any;
  selectedTab: string;
  formatYAxis: (value: any, tab: string) => string;
}

export const CustomTooltip: React.FC<CustomTooltipProps> = ({
  active,
  payload,
  label,
  hoveredSeries,
  isPinned,
  pinnedEntry,
  pinnedLabel,
  setIsPinned,
  varianceData,
  selectedTab,
  formatYAxis,
}) => {
  if ((!active || !payload?.length || !hoveredSeries) && !isPinned) {
    return null;
  }
  const entry = isPinned
    ? pinnedEntry
    : payload?.find((p) => p.dataKey === hoveredSeries);
  if (!entry) return null;

  const [tooltipDivision] = entry.name.split(" - ");
  const monthKey = isPinned ? pinnedLabel : label;
  const match = varianceData
    ?.find((d: any) => d.division === tooltipDivision)
    ?.varianceData.find((v: any) => v.month === monthKey);

  let display = `${formatYAxis(entry.value, selectedTab)}`;
  if (match) {
    display +=
      ` (Variance of Target: ${match.varianceOfTarget.toFixed(2)}%, ` +
      `Last Year: ${match.varianceOfLastYear.toFixed(2)}%)`;
  }

  return (
    <div
      style={{
        background: "rgba(255,255,255,0.9)",
        border: "1px solid #ccc",
        borderRadius: 4,
        padding: 8,
        maxHeight: 100,
        overflowY: "auto",
        position: "relative",
        fontSize: 12,
      }}
    >
      {isPinned && (
        <button
          onClick={() => setIsPinned(false)}
          style={{
            position: "absolute",
            top: 4,
            right: 4,
            border: "none",
            background: "transparent",
            cursor: "pointer",
          }}
        >
          ✕
        </button>
      )}
      <div style={{ fontWeight: "bold", marginBottom: 4 }}>
        {isPinned ? pinnedLabel : label}
      </div>
      <div>
        {entry.name}: {display}
      </div>
    </div>
  );
};
