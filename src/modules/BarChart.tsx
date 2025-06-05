import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  Tooltip,
  Cell,
} from "recharts";
import { Box } from "@mui/material";
import { useMediaQuery } from "@mui/material";
import { divisions } from "../utils/staticDataUtis";
import { formatYAxisTick } from "../utils/graphUtils";
import React, { useState } from "react";

// Fallback colors if type is Expenditure or Earning
const defaultColors = [
  "#FFD23D",
  "#6320EE",
  "#F45428",
  "#00A6FB",
  "#77C043",
  "#C85C8E",
  "#3E7CB1",
];

// Format camelCase keys to readable labels
function formatKeyToLabel(key: string): string {
  switch (key) {
    case "targetThisMonth":
      return "Target";
    case "targetYTDThisMonth":
      return "Target YTD";
    case "actualThisMonth":
      return "Actual";
    case "actualThisMonthLastYear":
      return "LFY";
    case "targetLastFinancialYear":
      return "LFY YTD Target";
    case "targetCurrentFinancialYear":
      return "CFY Target";
    case "actualLastFinancialYear":
      return "Actual (last FY)";
    case "actualYTDThisMonthLastYear":
      return "LFY YTD Actual";
    case "actualYTDThisMonth":
      return "CFY YTD Actual";
    default:
      return key
        .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
        .replace(/^./, (str) => str.toUpperCase());
  }
}

// CustomBar component for direct bar hover
const CustomBar = ({ x, y, width, height, fill, onMouseEnter, onMouseLeave, onMouseMove }: any) => (
  <rect
    x={x}
    y={y}
    width={width}
    height={height}
    fill={fill}
    rx={3}
    onMouseEnter={onMouseEnter}
    onMouseLeave={onMouseLeave}
    onMouseMove={onMouseMove}
    style={{ cursor: "pointer" }}
  />
);

// Custom absolute tooltip
const AbsoluteTooltip = ({ visible, x, y, division, metricName, metricValue, color, type }: any) => {
  if (!visible) return null;
  const boxOffset = 48; // distance above the mouse
  return (
    <div
      style={{
        position: "fixed",
        left: x + 12,
        top: y - boxOffset,
        zIndex: 9999,
        pointerEvents: "none",
        backgroundColor: "rgba(51, 51, 51, 0.95)",
        padding: "12px 16px 18px 16px", // extra bottom padding for arrow
        borderRadius: "8px",
        color: "#fff",
        fontSize: 12,
        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
        minWidth: "180px",
        transform: "translateY(-8px)", // nudge up a bit more
      }}
    >
      <div style={{
        fontWeight: 600,
        marginBottom: 8,
        fontSize: 14,
        borderBottom: "1px solid rgba(255, 255, 255, 0.2)",
        paddingBottom: 6
      }}>
        {division}
      </div>
      {(type === "Earning" || type === "Expenditure") && (
        <div style={{
          fontSize: 10,
          marginBottom: 8,
          color: "rgba(255, 255, 255, 0.7)"
        }}>
          Figures in thousands
        </div>
      )}
      <div style={{
        display: "flex",
        alignItems: "center",
        marginBottom: 6,
        padding: "4px 0"
      }}>
        <span
          style={{
            display: "inline-block",
            width: 10,
            height: 10,
            backgroundColor: color,
            marginRight: 8,
            borderRadius: 2,
          }}
        />
        <span style={{
          color: "#fff",
          flex: 1,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <span>{metricName}</span>
          <span style={{ marginLeft: 16, fontWeight: 500 }}>
            ₹ {metricValue?.toLocaleString()}
          </span>
        </span>
      </div>
      {/* Arrow below the box */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          bottom: 2,
          transform: "translateX(-50%)",
          width: 0,
          height: 0,
          borderLeft: "8px solid transparent",
          borderRight: "8px solid transparent",
          borderTop: "8px solid rgba(51, 51, 51, 0.95)",
        }}
      />
    </div>
  );
};

function formatNumber(value: number): string {
  return value.toLocaleString("en-IN");
}

function BarGraph({
  data,
  stackId,
  type,
  showEmptyBars,
  divisions: divisionsProp,
}: {
  data: any[];
  stackId: boolean;
  type: string;
  showEmptyBars?: boolean;
  divisions?: string[];
}) {
  const isSmallScreen = useMediaQuery("(max-width: 700px)");

  // Tooltip state
  const [tooltip, setTooltip] = useState({
    visible: false,
    x: 0,
    y: 0,
    division: "",
    metricName: "",
    metricValue: 0,
    color: "#fff"
  });

  if (!data || data.length === 0) return null;

  const keys = Object.keys(data[0]).filter(
    (key) => key !== "date" && key !== "division"
  );

  // Use the divisions prop if provided, otherwise fall back to the imported divisions
  const divisionsToUse = divisionsProp || divisions;

  return (
    <Box
      sx={{
        width: "100%",
        height: isSmallScreen ? 300 : 400,
        mt: 2,
        display: "flex",
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <ResponsiveContainer width="98%" height="100%">
        <BarChart
          barCategoryGap={20}
          barGap={5}
          barSize={20}
          data={data}
          margin={{ top: 20, right: 20, left: 50, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
          <XAxis 
            dataKey="division" 
            tick={{ fill: "white" }}
            axisLine={{ stroke: "rgba(255, 255, 255, 0.2)" }}
          />
          <YAxis
            tickFormatter={(value) => formatYAxisTick(value, type)}
            tick={{ fill: "white", fontSize: 12 }}
            axisLine={{ stroke: "rgba(255, 255, 255, 0.2)" }}
          />

          {keys.map((key, keyIndex) => (
            <Bar
              key={key}
              dataKey={key}
              name={formatKeyToLabel(key)}
              barSize={30}
              {...(stackId ? { stackId: "a" } : {})}
              shape={(barProps: any) => {
                const { x, y, width, height, payload } = barProps;
                const division = payload.division;
                const divisionInfo = (divisionsToUse as Array<{ name: string; shades: string[] }>)?.find(
                  (d) => d.name === division
                );
                const shades = divisionInfo?.shades || defaultColors;
                const color =
                  type === "Expenditure" || type === "Earning"
                    ? shades[keyIndex % shades.length]
                    : defaultColors[keyIndex % defaultColors.length];
                return (
                  <CustomBar
                    x={x}
                    y={y}
                    width={width}
                    height={height}
                    fill={color}
                    onMouseEnter={(e: any) => {
                      setTooltip({
                        visible: true,
                        x: e.clientX,
                        y: e.clientY,
                        division,
                        metricName: formatKeyToLabel(key),
                        metricValue: payload[key],
                        color
                      });
                    }}
                    onMouseMove={(e: any) => {
                      setTooltip((prev) => ({ ...prev, x: e.clientX, y: e.clientY }));
                    }}
                    onMouseLeave={() => {
                      setTooltip((prev) => ({ ...prev, visible: false }));
                    }}
                  />
                );
              }}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
      {/* Render the absolute tooltip */}
      <AbsoluteTooltip
        {...tooltip}
        type={type}
      />
    </Box>
  );
}

export default BarGraph;