import React, { useEffect, useState } from "react";
import {
  Paper,
  Box,
  Grid,
  Typography,
  Backdrop,
  CircularProgress,
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
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { sqlService } from "../services/sqldata.service";
import { getMonthYear } from "../utils/otherUtils";
import { getLabel } from "../utils/staticDataUtis";
import { log } from "util";

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
  varianceData?: any;
}

const TrendGraph = ({
  uniqueCategories,
  lineData,
  selectedTab,
  color,
  dataDownload,
  month,
  graphType,
  varianceData,
}: any) => {
  console.log("this is linedata");
  console.log(lineData);
  console.log(graphType);

  const [loading, setLoading] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const formatNumber = (num: number) => num.toLocaleString("en-IN"); // Adds commas (e.g., 10000 → 10,000)

  const formatYAxis = (value: any, selectedTab: any) => {
    const formatWithLimit = (num: number) => {
      const strNum = num.toString();

      // Check if the number exceeds 11 digits
      if (strNum.length > 11) {
        // Take first 11 digits only, then add "..."
        const truncatedNum = strNum.slice(0, 11);

        // Convert truncated string back to a number for formatting
        const formattedTruncated = Number(truncatedNum).toLocaleString("en-IN");

        return formattedTruncated + "...";
      }

      // If within 11 digits, format normally
      return formatNumber(num);
    };

    const formattedValue = formatWithLimit(value);
    return selectedTab === "amount" ? `₹${formattedValue}` : formattedValue;
  };

  const formatXAxis = (value: string) => value;
  async function downloadData(month: any, graphType: string, name: string) {
    try {
      console.log("this downloadata is called");

      setLoading(true);
      setSnackbarOpen(true);
      setSnackbarMessage("Downloading data...");

      const monthData = getMonthYear(month.month, month.year);

      let data = {
        month: monthData,
        categoryType: graphType ? graphType.toLowerCase() : "",
        pieDataType: name,
      };

      // Fetch data from the service

      const response = await sqlService.downloadTrendCsvData(data); // Adjust this function as needed
      console.log("this is response");

      console.log(response);

      if (response) {
        setSnackbarOpen(true);
        setSnackbarMessage(response.message);
        console.log(response);

        const { sbiMaster, arpanData } = response;

        const sbiKeys = Object.keys(sbiMaster[0]);
        const debitKeys = Object.keys(arpanData[0]);

        // Combine column headers
        const columnHeaders = [...sbiKeys, ...debitKeys];

        // Combine data rows
        const dataRows = sbiMaster.map((sbiRow: any, index: any) => {
          const debitRow = arpanData[index] || {};
          return [
            ...sbiKeys.map((key) => sbiRow[key]),
            ...debitKeys.map((key) => debitRow[key]),
          ];
        });

        // First header row
        const firstRow = [
          "SBI Master",
          ...new Array(sbiKeys.length - 1).fill(""), // merged cells
          "Debit Scroll",
          ...new Array(debitKeys.length - 1).fill(""),
        ];

        // Second header row (actual column names)
        const secondRow = columnHeaders;

        // Create the full sheet data
        const worksheetData = [firstRow, secondRow, ...dataRows];

        // Create worksheet
        const ws = XLSX.utils.aoa_to_sheet(worksheetData);

        // Merge cells for "SBI Master" and "Debit Scroll"
        ws["!merges"] = [
          { s: { r: 0, c: 0 }, e: { r: 0, c: sbiKeys.length - 1 } }, // SBI Master merge
          {
            s: { r: 0, c: sbiKeys.length },
            e: { r: 0, c: sbiKeys.length + debitKeys.length - 1 },
          }, // Debit Scroll merge
        ];

        // Create workbook
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Data");

        // Write to binary array
        const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });

        // Trigger download
        const blob = new Blob([wbout], { type: "application/octet-stream" });
        saveAs(blob, "data.csv");
      } else {
        setSnackbarOpen(true);
        setSnackbarMessage(response.message);
      }
    } catch (error) {
      setLoading(false);
      console.error("Error downloading data:", error);
      setSnackbarOpen(true);
      setSnackbarMessage("Failed to download data. Please try again.");
    } finally {
      setLoading(false);
    }
  }
  return (
    <>
      <Backdrop open={loading} sx={{ color: "#fff", zIndex: 1301 }}>
        <CircularProgress color="inherit" />
      </Backdrop>
      <Box
        sx={{
          display: "flex",
          height: "100%",
          flexDirection: "column",

          width: "100%",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {/* Toggle Buttons */}

        {/* Chart Section */}
        <Grid
          container
          justifyContent="center"
          alignItems="center"
          sx={{
            flexGrow: 1,
            minHeight: 380,
            width: "100%",
          }}
        >
          <Box
            sx={{
              display: "flex",
              justifyContent: "flex-start",
              height: "10%",
              mt: 2,
              mb: 2,
              width: "95%",
              overflowX: "auto",
              whiteSpace: "nowrap",
              scrollbarColor: "#555 #000", // for Firefox
              "&::-webkit-scrollbar": {
                height: 6,
              },
              "&::-webkit-scrollbar-track": {
                backgroundColor: "#000", // black background
                borderRadius: 10,
              },
              "&::-webkit-scrollbar-thumb": {
                backgroundColor: "#555", // thumb color
                borderRadius: 10,
              },
              "&::-webkit-scrollbar-thumb:hover": {
                backgroundColor: "#888", // hover effect
              },
            }}
          >
            {uniqueCategories.map((category: any, index: any) => (
              <Box
                key={index}
                sx={{
                  display: "inline-flex", // 👈 inline to keep horizontal
                  alignItems: "center",
                  gap: "5px",
                  mx: 1,
                  cursor: "pointer",
                }}
                onClick={() => {
                  console.log("onlcick is called");
                  if (dataDownload) {
                    downloadData(month, graphType, category);
                  }
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
                <Typography
                  variant="body2"
                  fontSize={14}
                  fontWeight="bold"
                  color={color}
                  sx={{
                    fontFamily: "MyCustomFont,SourceSerif4_18pt",
                    textTransform: "none",
                  }}
                >
                  {getLabel(category)}
                </Typography>
              </Box>
            ))}
          </Box>

          <ResponsiveContainer
            width="96%"
            height={"80%"}
            style={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <LineChart
              data={lineData}
              margin={{ top: 0, bottom: 10 }}
              style={{ cursor: "pointer" }}
            >
              <XAxis
                dataKey="month"
                tick={{ fill: "#fff", fontSize: 12, color: "#fff" }}
                tickFormatter={formatXAxis}
                padding={{ left: 40, right: 20 }}
              />
              <YAxis
                width={100}
                tick={{ fill: "#fff", fontSize: 12, color: "#fff" }}
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
                /* your existing props… */

                formatter={(value: number, name: string, props: any) => {
                  // only show variance on the actualYTDThisMonth line
                  // split out division vs. series key
                  const [tooltipDivision, seriesKey] = name.split(" - ");

                  if (seriesKey === "actualYTDThisMonth") {
                    const tooltipMonth = props.payload?.month;
                    const tooltipDivision = name.split(" - ")[0];

                    // find the matching variance entry for this division/month
                    const matching = varianceData
                      ?.find((d: any) => d.division === tooltipDivision)
                      ?.varianceData.find((v: any) => v.month === tooltipMonth);

                    if (
                      matching?.varianceOfTarget !== undefined &&
                      matching?.varianceOfLastYear !== undefined
                    ) {
                      return [
                        `${formatYAxis(value, selectedTab)} ` +
                          `(Variance of Target: ${matching.varianceOfTarget.toFixed(
                            2
                          )}%, ` +
                          `Variance of Last Year: ${matching.varianceOfLastYear.toFixed(
                            2
                          )}%)`,
                        name,
                      ];
                    }
                  }

                  // fallback for everything else
                  return [formatYAxis(value, selectedTab), name];
                }}
              />

              {uniqueCategories.map((category: any, index: any) => (
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
        </Grid>
      </Box>
    </>
  );
};

export default TrendGraph;
