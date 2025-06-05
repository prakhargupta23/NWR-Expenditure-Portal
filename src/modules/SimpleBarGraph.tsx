import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { Box, Typography, useMediaQuery } from "@mui/material";
import { formatKeyToLabel, formatYAxisTick } from "../utils/graphUtils";
import React, { useState } from "react";

// Static data for the month with shades for each division
export const divisions = [
  {
    name: "Jaipur",
    shades: ["#ffe1dd", "#ffb3a7", "#ff8675", "#ff6f61", "#cc594e", "#993f36"], // Base: #ff6f61
  },
  {
    name: "Ajmer",
    shades: ["#d4f5db", "#b0efc1", "#8be9a7", "#88b04b", "#6e943c", "#55772e"], // Base: #88b04b
  },
  {
    name: "Bikaner",
    shades: ["#dadbee", "#b2b5d6", "#8b8fbe", "#6b5b95", "#55497a", "#3f375f"], // Base: #6b5b95
  },
  {
    name: "Jodhpur",
    shades: ["#fff2cc", "#ffe199", "#ffd066", "#ffa500", "#cc8400", "#996300"], // Base: #ffa500
  },
];

// Label map for better display
const labelMap: Record<string, string> = {
  openingBalance: "Opening Balance",
  accretionUptoTheMonth: "Accretion Upto The Month",
  clearanceUptoMonth: "Clearance Upto Month",
  closingBalance: "Closing Balance",
};

function formatNumber(value: number): string {
  return value.toLocaleString("en-IN");
}

interface Props {
  data: { division: string; [key: string]: number | string }[];
  graphType: string;
  stackId?: boolean;
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
      <div style={{
        fontSize: 11,
        color: "rgba(255, 255, 255, 0.7)",
        marginBottom: 8,
        fontStyle: "Bold"
      }}>
        Figures in Thousands
      </div>
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

function MultiDivisionMetricBarGraph({
  data,
  stackId = false,
  graphType,
}: Props) {
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
  console.log("this i sdata");
  console.log(data);

  // Get all metric keys (excluding 'division')
  const keys = Object.keys(data[0]).filter((k) => k !== "division");

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
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="key"
            tick={{
              fill: "white",
              fontSize: 10,
              fontWeight: 400,
            }}
            tickFormatter={(value) => formatKeyToLabel(value)}
          />
          <YAxis
            tickFormatter={(value) => formatYAxisTick(value, graphType)}
            tick={{ fill: "white", fontSize: 12 }}
          />

          {/* Remove default Tooltip */}

          {keys
            .filter(
              (key) =>
                ![
                  "openingBalance",
                  "accretionUptoTheMonth",
                  "clearanceUptoMonth",
                  "closingBalance",
                ].includes(key)
            )
            .map((key, index) => {
              let divisionName = key;
              // Get the shades for the current division
              const divisionShades = divisions.find(
                (division) => division.name === divisionName
              )?.shades || ["#8884d8"];
              // Select a shade based on the key index (avoid same shade for different keys)
              const shade = divisionShades[index % divisionShades.length];
              return (
                <Bar
                  key={key}
                  dataKey={key}
                  name={formatKeyToLabel(key)}
                  fill={shade}
                  barSize={30}
                  {...(stackId ? { stackId: "a" } : {})}
                  shape={(barProps: any) => {
                    const { x, y, width, height, payload } = barProps;
                    const division = payload.division;
                    return (
                      <CustomBar
                        x={x}
                        y={y}
                        width={width}
                        height={height}
                        fill={shade}
                        onMouseEnter={(e: any) => {
                          setTooltip({
                            visible: true,
                            x: e.clientX,
                            y: e.clientY,
                            division,
                            metricName: formatKeyToLabel(key),
                            metricValue: payload[key],
                            color: shade
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
              );
            })}
        </BarChart>
      </ResponsiveContainer>
      {/* Render the absolute tooltip */}
      <AbsoluteTooltip
        {...tooltip}
        type={graphType}
      />
    </Box>
  );
}

export default MultiDivisionMetricBarGraph;
