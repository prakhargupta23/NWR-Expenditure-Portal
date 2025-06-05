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
import "../Home.css";
import { sqlService } from "../services/sqldata.service";
import PieGraph from "../modules/PieGraph";
import TrendGraph from "../modules/TrendGraph";
import { allMonths, getMonthYear } from "../utils/otherUtils";
import BottomDetailSection from "../modules/BottomDetailSection";
import { useSummaryQuery } from "../CustomHooks/CustomSummaryQueryHook";
import { useFetchDataForPensionWithRetry } from "../Hooks/useFetchCustomHookForPension";
import { years } from "../utils/staticDataUtis";

function CommutationGraph({ type, reloadGraph }: any) {
  const [selectedDate, setSelectedDate] = useState({
    month: "January",
    year: new Date().getFullYear(),
  });
  const [selectedTab, setSelectedTab] = useState("count"); // "amount" uses sum, "count" uses count
  const [selectedGraphTab, setSelectedGraphTab] = useState("Overview");

  const [pieData, setPieData] = useState<any[]>([]);
  const [uniqueCategories, setUniqueCategories] = useState<any[]>([]);

  // Convert month to "MM/YYYY" format
  /// Custom hook function for the Summary Data -----------------------------------------/
  const { summaryData, summaryLoading } = useSummaryQuery(selectedDate);

  const handleChartToggle = (
    event: React.MouseEvent<HTMLElement>,
    newType: any
  ) => {
    if (newType !== null) {
      setSelectedGraphTab(newType);
    }
  };

  const currentYear = new Date().getFullYear();

  const handleTabChange = (event: any, newTab: any) => {
    if (newTab !== null) {
      setSelectedTab(newTab);
    }
  };
  // First useEffect: Fetch full data
  const { data, loading } = useFetchDataForPensionWithRetry({
    service: sqlService,
    method: "fetchBasicAndCommutationData",
    params: ["commutation"], // this is the optional argument
    dependencies: [], // or add reloadGraph if needed
  });

  // Second useEffect: Filter data based on selectedDate, selectedTab, and selectedGraphTab
  useEffect(() => {
    try {
      if (!data || data.length === 0) return;

      const selectedMonthYear = getMonthYear(
        selectedDate.month,
        selectedDate.year
      );

      // Find the matching month data
      const key = selectedTab === "amount" ? "sum" : "count";

      if (selectedGraphTab === "Overview") {
        const monthData = data.find((item) => item.month === selectedMonthYear);
        console.log("Filtered month data:", monthData);

        if (!monthData) {
          setPieData([]);
          setUniqueCategories([]);
          return;
        }

        // Filter categories where the selected key (sum/count) is greater than 0
        const formattedOverview = Object.entries(monthData)
          .filter(([category, values]: [string, any]) => {
            if (category === "month") return false; // Exclude "month"

            // Exclude categories where the selected key is 0
            return values[key] > 0;
          })
          .map(([category, values]: [string, any]) => ({
            name: category,
            value: values[key],
          }));

        // Unique categories should match the filtered data
        const uniqueCategories = formattedOverview.map((item) => item.name);

        console.log("Unique Categories:", uniqueCategories);
        setUniqueCategories(uniqueCategories);

        console.log("Formatted Overview Data:", formattedOverview);
        setPieData(formattedOverview);
      } else {
        // Format data dynamically for Trend (Line Chart)
        // Format data dynamically for Trend (Line Chart)
        const rawTrendData = data.map((item) => ({
          month: item.month,
          ...Object.fromEntries(
            Object.entries(item)
              .filter(([category]) => category !== "month") // Exclude "month"
              .map(([category, values]: [string, any]) => [
                category,
                values[key],
              ])
          ),
        }));

        // STEP 1: Collect all categories (excluding "month")
        const allCategories = Array.from(
          new Set(
            data.flatMap((item) =>
              Object.keys(item).filter((key) => key !== "month")
            )
          )
        );

        // STEP 2: Filter categories that have **any** non-zero value
        const filteredCategories = allCategories.filter((category) =>
          rawTrendData.some((item: any) => item[category] > 0)
        );

        // STEP 3: Rebuild the trendData with only filtered categories
        const filteredTrendData = rawTrendData.map((item: any) => {
          const filteredItem: any = { month: item.month };
          filteredCategories.forEach((category) => {
            filteredItem[category] = item[category];
          });
          return filteredItem;
        });

        // STEP 4: Set state
        setUniqueCategories(filteredCategories);
        setPieData(filteredTrendData);
      }
    } catch (error) {
      console.error("Error processing data:", error);
    }
  }, [data, selectedTab, selectedGraphTab, selectedDate]);

  return (
    <>
      {/* Top Section: Overview/Trend Toggle */}
      <Box
        sx={{
          width: "96%",
          paddingTop: "2%",
          display: "flex",
          justifyContent: "flex-start",
          alignItems: "center",
        }}
      >
        <ToggleButtonGroup
          value={selectedGraphTab}
          onChange={handleChartToggle}
          exclusive
          sx={{
            backgroundColor: "#222633",
            borderRadius: "12px",
            overflow: "hidden",
            height: "40px",
            width: { xs: "60%", lg: "40%" },
            border: "1px solid rgba(255, 255, 255, 0.3)", // Add subtle border
          }}
        >
          <ToggleButton
            value="Overview"
            sx={{
              flex: 1,
              width: "133px",
              color: selectedGraphTab === "Overview" ? "#fff" : "#A5A5A5",
              background:
                selectedGraphTab === "Overview"
                  ? "linear-gradient(90deg, #7B2FF7, #9F44D3)"
                  : "transparent",
              "&.Mui-selected": {
                background: "linear-gradient(90deg, #7B2FF7, #9F44D3)",
                color: "#fff",
              },
              borderRadius: "12px 0 0 12px", // Rounded left side
              fontSize: 16,
              fontWeight: "600",
              lineHeight: "100%",
              fontFamily: "MyCustomFont, SourceSerif4_18pt",
              textTransform: "none",
              transition: "0.3s",
            }}
          >
            Overview
          </ToggleButton>
          <ToggleButton
            value="Trend"
            sx={{
              flex: 1,
              color: selectedGraphTab === "Trend" ? "#fff" : "#A5A5A5",
              background:
                selectedGraphTab === "Trend"
                  ? "linear-gradient(90deg, #7B2FF7, #9F44D3)"
                  : "transparent",
              "&.Mui-selected": {
                background: "linear-gradient(90deg, #7B2FF7, #9F44D3)",
                color: "#fff",
              },
              borderRadius: "12px 0 0 12px", // Rounded left side
              fontSize: 16,
              fontWeight: "600",
              lineHeight: "100%",
              textTransform: "none",
              fontFamily: "MyCustomFont, SourceSerif4_18pt",
              transition: "0.3s",
            }}
          >
            Trend
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Date Selector, Month Selection, Count/Amount Toggle in One Row */}

      {/* Divider Below Row */}
      <Paper
        elevation={3}
        sx={{
          display: "flex",
          marginTop: "12px",
          marginBottom: "12px",
          marginRight: "12px",
          marginLeft: "12px",
          flexDirection: "column",
          height: "100%",
          width: "96%",
          borderRadius: "10px",
          backgroundColor: "#222633",
          justifyContent: "flex-start",

          alignItems: "center",
          border: "1px solid #222633", // Ensures the border is visible
        }}
      >
        <Grid
          container
          justifyContent="center"
          alignItems="center"
          sx={{
            height: selectedGraphTab === "Overview" ? "90%" : "90%",
          }}
        >
          <Grid
            container
            alignItems="center"
            justifyContent="space-between"
            spacing={2}
            sx={{
              width: "100%",
              flexWrap: "wrap",
              mt: 1,
            }}
          >
            {selectedGraphTab === "Overview" ? (
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
                    backgroundColor: "#222633",
                    borderRadius: "10px",
                    height: "40px",
                    maxWidth: "180px",
                    minWidth: "150px",

                    fontWeight: "600",
                    color: "#fff",
                    justifyContent: "space-between",
                    display: "flex",
                    alignItems: "center",

                    border: "1px solid rgba(255, 255, 255, 0.2)", // Add subtle border
                    fontFamily: "MyCustomFont,SourceSerif4_18pt",
                    "& .MuiSelect-icon": {
                      color: "#fff",
                    },
                  }}
                >
                  {allMonths.map((month, index) => (
                    <MenuItem key={index} value={month}>
                      {month}
                    </MenuItem>
                  ))}
                </Select>
              </Grid>
            ) : null}
            {selectedGraphTab === "Overview" ? (
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
                    backgroundColor: "#222633",
                    borderRadius: "10px",
                    height: "40px",
                    maxWidth: "180px",
                    minWidth: "150px",

                    fontWeight: "600",
                    color: "#fff",
                    justifyContent: "space-between",
                    display: "flex",
                    alignItems: "center",

                    border: "1px solid rgba(255, 255, 255, 0.2)", // Add subtle border
                    "& .MuiSelect-icon": {
                      color: "#fff",
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
            ) : null}

            {/* Count/Amount Toggle (Right) */}
            <Grid
              item
              xs={12}
              sm={12}
              md={12}
              lg={selectedGraphTab === "Overview" ? 4 : 12}
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

                  minWidth: "160px",
                  maxWidth: "200px",
                  backgroundColor: "#222633",
                  border: "1px solid rgba(255, 255, 255, 0.3)", // Add subtle border
                  width: "100%",
                }}
              >
                <ToggleButton
                  value="count"
                  sx={{
                    flex: 1,
                    fontWeight: "600",
                    color: selectedGraphTab === "count" ? "#fff" : "#A5A5A5",
                    background:
                      selectedGraphTab === "count"
                        ? "linear-gradient(90deg, #7B2FF7, #9F44D3)"
                        : "#222633",
                    "&.Mui-selected": {
                      background: "linear-gradient(90deg, #7B2FF7, #9F44D3)",
                      color: "#fff",
                    },
                    borderRadius: "14px 0 0 14px", // Smooth left border
                    fontSize: 16,
                    fontFamily: "MyCustomFont,SourceSerif4_18pt",
                    textTransform: "none",
                    lineHeight: "100%",
                  }}
                >
                  Count
                </ToggleButton>
                <ToggleButton
                  value="amount"
                  sx={{
                    flex: 1,
                    fontWeight: "600",
                    color: selectedGraphTab === "amount" ? "#fff" : "#A5A5A5",
                    background:
                      selectedGraphTab === "amount"
                        ? "linear-gradient(90deg, #7B2FF7, #9F44D3)"
                        : "#222633",
                    "&.Mui-selected": {
                      background: "linear-gradient(90deg, #7B2FF7, #9F44D3)",
                      color: "#fff",
                    },
                    borderRadius: "14px 0 0 14px", // Smooth left border
                    fontSize: 16,
                    fontFamily: "MyCustomFont,SourceSerif4_18pt",
                    textTransform: "none",
                    lineHeight: "100%",
                  }}
                >
                  Amount
                </ToggleButton>
              </ToggleButtonGroup>
            </Grid>
          </Grid>
          {loading ? (
            <CircularProgress />
          ) : pieData && pieData.length > 0 ? (
            <>
              {selectedGraphTab === "Overview" ? (
                <PieGraph
                  uniqueCategories={uniqueCategories}
                  pieData={pieData}
                  selectedTab={selectedTab}
                  color="#fff"
                  dataDownload={true}
                  month={selectedDate}
                  graphType={type}
                />
              ) : (
                <TrendGraph
                  uniqueCategories={uniqueCategories}
                  lineData={pieData}
                  selectedTab={selectedTab}
                  color="#fff"
                />
              )}
            </>
          ) : (
            <Typography
              sx={{
                color: "#fff",
                fontFamily: "MyCustomFont,SourceSerif4_18pt",
              }}
            >
              No Data Available
            </Typography>
          )}
        </Grid>
      </Paper>
      {selectedGraphTab === "Overview" ? (
        <>
          <BottomDetailSection
            loading={summaryLoading}
            summaryData={summaryData}
          />
        </>
      ) : null}
    </>
  );
}

export default CommutationGraph;
