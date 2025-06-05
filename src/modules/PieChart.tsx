import React, { useEffect, useState } from "react";
import {
  Grid,
  Paper,
  Typography,
  Button,
  Box,
  Divider,
  CircularProgress,
  ToggleButtonGroup,
  ToggleButton,
  Select,
  MenuItem,
  Container,
} from "@mui/material";
import { CalendarMonth, Download, ArrowDropDown } from "@mui/icons-material";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { csvService } from "../services/csv.service";
import DateRange from "./DatePicker";

const CATEGORY_STYLES = [
  { bg: "#FFFAE8", text: "#9A7B14", dot: "#FFD23D" },
  { bg: "#F4EEFF", text: "#6320EE", dot: "#6320EE" },
  { bg: "#FFEEEA", text: "#9A3215", dot: "#F45428" },
  { bg: "#E8F8FF", text: "#005682", dot: "#00A6FB" },
  { bg: "#F0F8EA", text: "#3D6B00", dot: "#77C043" },
];
const allMonths = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

interface ChartProps {
  loading: boolean;
  pieData: any[];
  selectedTab: any;
  setSelectedTab: (type: string) => void;
  uniqueCategories: any[];
  summaryData: any;
  selectedDate: any;
  setSelectedDate: (type: any) => void;
  selectedGraphTab: any;
  setSelectedGraphTab: any;
  dataDownload?: boolean;
}

export default function PieChartCompo({
  loading,
  pieData,
  uniqueCategories,
  summaryData,
  selectedDate,
  setSelectedDate,
  setSelectedGraphTab,
  selectedTab,
  setSelectedTab,
  selectedGraphTab,
  dataDownload,
}: ChartProps) {
  const handleChartToggle = (
    event: React.MouseEvent<HTMLElement>,
    newType: any
  ) => {
    console.log("this is newtype");
    console.log(newType);

    if (newType !== null) {
      setSelectedGraphTab(newType);
    }
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from(
    { length: currentYear - 1950 + 1 },
    (_, i) => 1950 + i
  );
  const handleTabChange = (event: any, newTab: any) => {
    if (newTab !== null) {
      setSelectedTab(newTab);
    }
  };
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const { name, value, fill } = payload[0];
      return (
        <div
          className="custom-tooltip"
          style={{
            backgroundColor: "#fff",
            border: `1px solid ${fill}`,
            padding: "10px",
            borderRadius: "5px",
          }}
        >
          <p style={{ color: fill, margin: 0 }}>
            {`${name}: ${selectedTab === "amount" ? "₹" : ""}${value?.toFixed(
              2
            )}`}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Paper
      elevation={3}
      sx={{
        display: "flex",
        height: "100%",

        flexDirection: "column",

        borderRadius: "16px",
        width: "100%",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {/* Top Section: Overview/Trend Toggle */}
      <Box sx={{ width: "100%", display: "flex", justifyContent: "center" }}>
        <ToggleButtonGroup
          value={selectedGraphTab}
          onChange={handleChartToggle}
          exclusive
          sx={{
            backgroundColor: "#E0E0E0",
            borderRadius: "8px",
            overflow: "hidden",
            height: "40px",
            width: "60%",
          }}
        >
          <ToggleButton
            value="Overview"
            sx={{
              flex: 1,
              color: selectedGraphTab === "Overview" ? "#fff" : "#A5A5A5",
              backgroundColor:
                selectedGraphTab === "Overview" ? "#4F4266" : "#E8E8E8",
              "&.Mui-selected": { backgroundColor: "#4F4266", color: "#fff" },
              fontSize: 14,
            }}
          >
            Overview
          </ToggleButton>
          <ToggleButton
            value="Trend"
            sx={{
              flex: 1,
              color: selectedGraphTab === "Trend" ? "#fff" : "#A5A5A5",
              backgroundColor:
                selectedGraphTab === "Trend" ? "#4F4266" : "#E8E8E8",
              "&.Mui-selected": { backgroundColor: "#4F4266", color: "#fff" },
              fontSize: 14,
            }}
          >
            Trend
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Divider Below Toggle */}
      <Divider
        sx={{ mt: 2, width: "100%", borderWidth: 1, borderColor: "#B3B3B3" }}
      />

      {/* Date Selector, Month Selection, Count/Amount Toggle in One Row */}
      <Grid
        container
        alignItems="center"
        justifyContent="space-between"
        spacing={2}
        sx={{
          width: "100%",
          flexWrap: "wrap",
          marginTop: 2,
        }}
      >
        {/* Select Date (Left) */}
        {/* <Grid
          item
          xs={12}
          sm={12}
          md={12}
          lg={3}
          sx={{ display: "flex", justifyContent: "center" }}
        >
          <DateRange />
        </Grid> */}

        {/* Month Selection (Middle) */}
        <Grid
          item
          xs={12}
          sm={12}
          md={12}
          lg={4}
          sx={{ display: "flex", justifyContent: "center" }}
        >
          <Select
            value={selectedDate.month}
            onChange={(e) =>
              setSelectedDate((prev: any) => ({
                ...prev,
                month: e.target.value, // Assuming 'year' is the field to update
              }))
            }
            displayEmpty
            fullWidth
            sx={{
              backgroundColor: "#F6EFFD",
              borderRadius: "20px",
              height: "40px",
              maxWidth: "180px",
              minWidth: "150px",
            }}
          >
            {allMonths.map((month, index) => (
              <MenuItem key={index} value={month}>
                {month}
              </MenuItem>
            ))}
          </Select>
        </Grid>
        <Grid
          item
          xs={12}
          sm={12}
          md={12}
          lg={4}
          sx={{ display: "flex", justifyContent: "center" }}
        >
          <Select
            value={selectedDate.year}
            onChange={(e) =>
              setSelectedDate((prev: any) => ({
                ...prev,
                year: e.target.value, // Assuming 'year' is the field to update
              }))
            }
            displayEmpty
            fullWidth
            sx={{
              backgroundColor: "#F6EFFD",
              borderRadius: "20px",
              height: "40px",
              maxWidth: "200px",
              minWidth: "150px",
            }}
            MenuProps={{
              PaperProps: {
                style: {
                  maxHeight: 200, // Limits the dropdown height to enable scrolling
                },
              },
            }}
          >
            {years.map((year) => (
              <MenuItem key={year} value={year}>
                {year}
              </MenuItem>
            ))}
          </Select>
        </Grid>

        {/* Count/Amount Toggle (Right) */}
        <Grid
          item
          xs={12}
          sm={12}
          md={12}
          lg={4}
          sx={{ display: "flex", justifyContent: "center" }}
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
        </Grid>
      </Grid>

      {/* Divider Below Row */}
      <Divider
        sx={{ mt: 2, width: "100%", borderWidth: 1, borderColor: "#B3B3B3" }}
      />
      {/* Category Legend */}
      <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
        {uniqueCategories.map((category, index) => (
          <Box
            key={index}
            sx={{ display: "flex", alignItems: "center", gap: "5px", mx: 1 }} // Adds spacing between items
          >
            <Box
              sx={{
                width: "20px",
                height: "20px",
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

      {/* Pie Chart Section */}
      <Grid
        container
        justifyContent="center"
        alignItems="center"
        sx={{ minHeight: 280 }}
      >
        {loading ? (
          <CircularProgress />
        ) : pieData.length > 0 ? (
          <ResponsiveContainer width="100%" height={280}>
            {/* Reduced height */}
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                fontSize={16}
                outerRadius={100}
                innerRadius={50}
                label={({ name, value }) =>
                  `${name}: ${
                    selectedTab === "amount" ? "₹" : ""
                  }${value.toFixed(0)}`
                }
              >
                {pieData.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={CATEGORY_STYLES[index % CATEGORY_STYLES.length].dot}
                    onClick={(entry: any) => {
                      console.log("this is calling");

                      if (dataDownload) {
                        console.log("Clicked section:", entry.name);
                      }
                    }}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <Typography>No Data Available</Typography>
        )}
      </Grid>
      <Divider sx={{ width: "100%", borderWidth: 1, borderColor: "#B3B3B3" }} />
      {loading ? (
        <Container
          sx={{
            display: "flex",
            flexDirection: "row",
            width: "100%",
            justifyContent: "center",
            alignItems: "center",
            mt: 1,
          }}
        >
          <CircularProgress />
        </Container>
      ) : (
        <>
          <Grid
            container
            spacing={2}
            sx={{
              mt: 1,
              height: "140px",
              overflowY: "scroll",
              width: "100%",
            }}
          >
            {/* Linked Section */}
            <Grid item xs={12}>
              <Typography
                sx={{ fontSize: "14px", fontWeight: "bold", marginLeft: 2 }}
              >
                Linked
              </Typography>
            </Grid>

            {/* Card 1 - Net Mismatch */}
            <Grid item xs={12} sm={6}>
              <Paper
                elevation={1}
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  justifyContent: "center",

                  borderRadius: "12px",
                  border: "1px solid #DADADA",
                  minHeight: "80px",
                  marginLeft: 2,
                  width: "100%",
                  paddingLeft: 2,
                  paddingRight: 2,
                }}
              >
                <Typography
                  sx={{ fontSize: "12px", color: "#3E3E3E", fontWeight: 500 }}
                >
                  Net Mismatch
                </Typography>
                <Typography
                  sx={{
                    fontSize: "24px",
                    fontWeight: "bold",
                    color: "#000",
                    mt: 1,
                  }}
                >
                  ₹{summaryData.netMismatch.toLocaleString()}
                </Typography>
              </Paper>
            </Grid>

            <Grid container spacing={3} sx={{ mt: 1, px: 3, mb: 1 }}>
              <Grid item xs={12}>
                <Typography
                  sx={{ fontSize: "16px", fontWeight: "bold", marginLeft: 2 }}
                >
                  Unlinked
                </Typography>
              </Grid>

              {/* Card 1 - Unlinked Percentage */}
              <Grid item xs={12} sm={4} md={4}>
                <Paper
                  elevation={2}
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                    justifyContent: "center",
                    paddingLeft: 2,
                    paddingRight: 2,
                    borderRadius: "12px",
                    marginLeft: 2,
                    border: "1px solid #DADADA",
                    minHeight: "80px",
                  }}
                >
                  <Typography
                    sx={{ fontSize: "12px", color: "#3E3E3E", fontWeight: 500 }}
                  >
                    Unlinked Percentage
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: "24px",
                      fontWeight: "bold",
                      color: "#000",
                      mt: 1,
                    }}
                  >
                    {summaryData.unlinkedPercentage}%
                  </Typography>
                </Paper>
              </Grid>

              {/* Card 2 - Unlinked Cases */}
              <Grid item xs={12} sm={4} md={4}>
                <Paper
                  elevation={2}
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                    justifyContent: "center",
                    paddingLeft: 2,
                    paddingRight: 2,
                    borderRadius: "12px",
                    border: "1px solid #DADADA",
                    minHeight: "80px",
                  }}
                >
                  <Typography
                    sx={{ fontSize: "12px", color: "#3E3E3E", fontWeight: 500 }}
                  >
                    Unlinked Cases
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: "24px",
                      fontWeight: "bold",
                      color: "#000",
                      mt: 1,
                    }}
                  >
                    {summaryData.unlinkedCases}
                  </Typography>
                </Paper>
              </Grid>

              {/* Card 3 - Unlinked Amount */}
              <Grid item xs={12} sm={4} md={4}>
                <Paper
                  elevation={2}
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                    justifyContent: "center",
                    paddingLeft: 2,
                    paddingRight: 2,
                    marginLeft: 2,
                    borderRadius: "12px",
                    border: "1px solid #DADADA",
                    minHeight: "80px",
                  }}
                >
                  <Typography
                    sx={{ fontSize: "12px", color: "#3E3E3E", fontWeight: 500 }}
                  >
                    Unlinked Amount
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: "24px",
                      fontWeight: "bold",
                      color: "#000",
                      mt: 1,
                    }}
                  >
                    ₹{summaryData.unlinkedAmount.toLocaleString()}
                  </Typography>
                </Paper>
              </Grid>

              {/* Unlinked Section Header */}
            </Grid>
          </Grid>
        </>
      )}
    </Paper>
  );
}
