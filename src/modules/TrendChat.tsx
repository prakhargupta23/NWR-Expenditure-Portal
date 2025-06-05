import React, { useEffect, useState } from "react";
import {
  Paper,
  Box,
  ToggleButtonGroup,
  ToggleButton,
  Divider,
  Grid,
  Typography,
  CircularProgress,
  Container,
} from "@mui/material";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  CartesianGrid,
} from "recharts";
import { processTrendData } from "../utils/graphUtils";

const CATEGORY_STYLES = [
  { bg: "#FFFAE8", text: "#9A7B14", dot: "#FFD23D" },
  { bg: "#F4EEFF", text: "#6320EE", dot: "#6320EE" },
  { bg: "#FFEEEA", text: "#9A3215", dot: "#F45428" },
  { bg: "#E8F8FF", text: "#005682", dot: "#00A6FB" },
  { bg: "#F0F8EA", text: "#3D6B00", dot: "#77C043" },
];

interface ChartProps {
  loadingData: boolean;
  loading: boolean;
  trendData: any[];
  categoryType: string;
  categories: any[];
  selectedTab: string;
  selectedGraphTab: string;
  setSelectedGraphTab: (value: string) => void;
  setSelectedTab: (type: string) => void;
}

const formatNumber = (num: number) => num.toLocaleString("en-IN"); // Adds commas (e.g., 10000 → 10,000)

const formatYAxis = (value: any, selectedTab: any) => {
  const formattedValue = formatNumber(value);

  return selectedTab === "amount" ? `₹${formattedValue}` : formattedValue;
};

const formatXAxis = (value: string) => value;
const TrendChat: React.FC<ChartProps> = ({
  loadingData,
  loading,
  trendData,
  categoryType,
  categories,
  selectedTab,
  selectedGraphTab,
  setSelectedGraphTab,
  setSelectedTab,
}) => {
  console.log("trend data");
  console.log(trendData);

  const [lineData, setLineData] = useState<any[]>([]);
  const [uniqueCategories, setUniqueCategories] = useState<string[]>([]);

  useEffect(() => {
    setUniqueCategories(categories);
    setLineData(trendData);
  }, [categoryType, trendData]);

  //// Function for changing the tab of count and amount ---------------------/
  const handleTabChange = (event: any, newTab: any) => {
    if (newTab !== null) {
      setSelectedTab(newTab);
    }
  };

  return (
    <Paper
      elevation={3}
      sx={{
        display: "flex",
        height: "100%",
        flexDirection: "column",
        borderRadius: "29px",
        width: "100%",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {/* Toggle Buttons */}
      <Box
        sx={{
          width: "100%",
          display: "flex",
          justifyContent: "center",
          mt: 2,
        }}
      >
        <ToggleButtonGroup
          value={selectedGraphTab}
          onChange={(_, newType) => newType && setSelectedGraphTab(newType)}
          exclusive
          sx={{
            backgroundColor: "#E0E0E0",
            borderRadius: "8px",
            height: 40,
            width: "60%",
          }}
        >
          {["Overview", "Trend"].map((tab) => (
            <ToggleButton
              key={tab}
              value={tab}
              sx={{
                flex: 1,
                fontSize: 14,
                color: selectedGraphTab === tab ? "#fff" : "#A5A5A5",
                backgroundColor:
                  selectedGraphTab === tab ? "#4F4266" : "#E8E8E8",
                "&.Mui-selected": { backgroundColor: "#4F4266", color: "#fff" },
              }}
            >
              {tab}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Box>

      <Divider sx={{ mt: 2, width: "100%", borderWidth: 1 }} />
      <Container
        sx={{
          width: "100%",
          display: "flex",
          flexDirection: "row",
          justifyContent: "center",
          alignItems: "center",
          marginTop: 2,
        }}
      >
        <ToggleButtonGroup
          value={selectedTab}
          exclusive
          onChange={handleTabChange}
          sx={{
            borderRadius: "14px",
            overflow: "hidden",
            display: "flex",
            height: "35px",
            backgroundColor: "#EAEAEA",
            border: "none",
            minWidth: "160px",
            maxWidth: "200px",
            width: "100%",
          }}
        >
          <ToggleButton
            value="count"
            sx={{
              flex: 1,
              fontWeight: "bold",
              color: selectedTab === "count" ? "#FFF" : "#7D7D7D",
              backgroundColor:
                selectedTab === "count" ? "#3D3D3D" : "transparent",
              "&.Mui-selected": { backgroundColor: "#3D3D3D", color: "#FFF" },
              "&:hover": {
                backgroundColor:
                  selectedTab === "count" ? "#3D3D3D" : "#DADADA",
              },
              fontSize: { xs: "12px", sm: "14px" },
              padding: "6px 12px",
              whiteSpace: "nowrap",
              textTransform: "none",
            }}
          >
            Count
          </ToggleButton>
          <ToggleButton
            value="amount"
            sx={{
              flex: 1,
              fontWeight: "bold",
              color: selectedTab === "amount" ? "#FFF" : "#7D7D7D",
              backgroundColor:
                selectedTab === "amount" ? "#3D3D3D" : "transparent",
              "&.Mui-selected": { backgroundColor: "#3D3D3D", color: "#FFF" },
              "&:hover": {
                backgroundColor:
                  selectedTab === "amount" ? "#3D3D3D" : "#DADADA",
              },
              fontSize: { xs: "12px", sm: "14px" },
              padding: "6px 12px",
              whiteSpace: "nowrap",
              textTransform: "none",
            }}
          >
            Amount
          </ToggleButton>
        </ToggleButtonGroup>
      </Container>
      {/* Chart Section */}
      <Grid
        container
        justifyContent="center"
        alignItems="center"
        sx={{
          flexGrow: 1,
          minHeight: 280,
          width: "100%",
        }}
      >
        {/* Legend */}
        {!loading && !loadingData && (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              height: "10%",
            }}
          >
            {uniqueCategories.map((category, index) => (
              <Box
                key={index}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  mx: 1,
                }}
              >
                <Box
                  sx={{
                    width: 20,
                    height: 20,
                    borderRadius: "50%",
                    backgroundColor:
                      CATEGORY_STYLES[index % CATEGORY_STYLES.length].dot,
                  }}
                />
                <Typography variant="body2" fontSize={14} fontWeight="bold">
                  {category}
                </Typography>
              </Box>
            ))}
          </Box>
        )}
        {loading || loadingData ? (
          <CircularProgress />
        ) : lineData.length > 0 ? (
          <ResponsiveContainer width="100%" height={"80%"}>
            <LineChart
              data={lineData}
              margin={{ top: 0, right: 20, left: 40, bottom: 10 }}
            >
              <XAxis
                dataKey="month"
                tick={{ fill: "#555", fontSize: 12 }}
                tickFormatter={formatXAxis}
                padding={{ left: 40, right: 20 }}
              />
              <YAxis
                tick={{ fill: "#555", fontSize: 12 }}
                tickFormatter={(value) => formatYAxis(value, selectedTab)}
                tickCount={6} // Ensure 5 breaks (6 ticks including start and end)
                allowDecimals={false} // Ensure whole number ticks
              />

              <CartesianGrid
                stroke="#E0E0E0"
                strokeWidth={1}
                vertical={false}
              />
              <Tooltip
                formatter={(value: number) => formatYAxis(value, selectedTab)}
              />
              {uniqueCategories.map((category, index) => (
                <Line
                  key={category}
                  type="monotone"
                  dataKey={category}
                  stroke={CATEGORY_STYLES[index % CATEGORY_STYLES.length].dot}
                  strokeWidth={2}
                  dot={{
                    fill: CATEGORY_STYLES[index % CATEGORY_STYLES.length].dot,
                    r: 5,
                  }}
                  activeDot={{
                    fill: CATEGORY_STYLES[index % CATEGORY_STYLES.length].dot,
                    r: 7,
                  }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <Typography>No Data Available</Typography>
        )}
      </Grid>
    </Paper>
  );
};

export default TrendChat;
