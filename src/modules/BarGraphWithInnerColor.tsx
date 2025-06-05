import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { Box, Typography, useMediaQuery } from "@mui/material";
import React from "react";

function formatNumber(value: number): string {
  return value.toLocaleString("en-IN");
}

function getColor(key: string): string {
  const colorMap: Record<string, string> = {
    openingBalance_BR: "#FFD23D",
    openingBalance_DR: "#FF6B6B",
    accretionUptoTheMonth_BR: "#6320EE",
    accretionUptoTheMonth_DR: "#00C49F",
    clearanceUptoMonth_BR: "#00A6FB",
    clearanceUptoMonth_DR: "#FFB347",
    closingBalance_BR: "#77C043",
    closingBalance_DR: "#C70039",
  };
  return colorMap[key] || "#ccc";
}

const labelMap: Record<string, string> = {
  openingBalance: "Opening Balance",
  accretionUptoTheMonth: "Accretion Upto The Month",
  clearanceUptoMonth: "Clearance Upto Month",
  closingBalance: "Closing Balance",
};

function getLabel(metric: string): string {
  return labelMap[metric] || metric;
}

// Custom tooltip to show data for all bars in a division when hovered
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length > 0) {
    // The first item in the payload should contain the division name
    const division = payload[0]?.payload?.division;

    return (
      <Box
        sx={{
          backgroundColor: "rgba(0, 0, 0, 0.85)",
          padding: "8px 12px",
          borderRadius: "6px",
          color: "#fff",
          fontSize: "12px",
          border: `1px solid #ccc`, // A default border color, as each bar has a different color
        }}
      >
        {/* Display Division Name */}
        {division && (
          <Typography fontWeight={600} fontSize={13} mb={0.5}>
            {division}
          </Typography>
        )}

        {/* Display data for each bar in the payload */}
        {payload.map((item: any, index: number) => {
          // Ensure item.dataKey is a string before splitting and item.value is a number
          if (typeof item.dataKey !== 'string' || typeof item.value !== 'number') return null;

          const [metric, type] = item.dataKey.split("_");
          const label = getLabel(metric);
          const value = item.value;
          const color = getColor(item.dataKey);

          return (
            <Typography key={index} fontSize={12} sx={{ color: color }}>
              {label} ({type}): {formatNumber(value)}
            </Typography>
          );
        })}
      </Box>
    );
  }

  return null;
};

const BarGraphWithInnerColor = ({ data }: { data: any[] }) => {
  const isSmallScreen = useMediaQuery("(max-width: 700px)");
  const baseMetrics = [
    "openingBalance",
    "accretionUptoTheMonth",
    "clearanceUptoMonth",
    "closingBalance",
  ];

  if (!data || data.length === 0) return null;

  return (
    <Box
      sx={{
        width: "100%",
        height: isSmallScreen ? 320 : 420,
        mt: 2,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <ResponsiveContainer width="95%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          barGap={2}
          barCategoryGap="20%"
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="division"
            tick={{ fill: "#fff" }}
            interval={0}
            angle={-10}
            textAnchor="end"
          />
          <YAxis
            tick={{ fill: "#fff" }}
            tickFormatter={(val) => val / 1000 + "K"}
          />
          <Tooltip
            cursor={{ fill: "rgba(255, 255, 255, 0.15)" }}
            content={<CustomTooltip />}
            filterNull={false}
          />
          {baseMetrics.map((metric) => (
            <React.Fragment key={metric}>
              <Bar
                dataKey={`${metric}_BR`}
                fill={getColor(`${metric}_BR`)}
                name={`${metric}_BR`}
                stackId={metric}
                barSize={15}
                radius={[2, 2, 0, 0]}
                isAnimationActive={false}
              />
              <Bar
                dataKey={`${metric}_DR`}
                fill={getColor(`${metric}_DR`)}
                name={`${metric}_DR`}
                stackId={metric}
                barSize={15}
                radius={[2, 2, 0, 0]}
                isAnimationActive={false}
              />
            </React.Fragment>
          ))}
        </BarChart>
      </ResponsiveContainer>
    </Box>
  );
};

export default BarGraphWithInnerColor;
