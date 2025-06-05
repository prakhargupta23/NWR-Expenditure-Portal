import React, { useEffect, useMemo, useState } from "react";
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
  BarChart,
  Bar,
} from "recharts";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { sqlService } from "../services/sqldata.service";
import { getMonthYear } from "../utils/otherUtils";
import { divisionsName, getLabel } from "../utils/staticDataUtis";
import { log } from "util";

import { divisions } from "../utils/staticDataUtis"; // adjust path if needed
import { formatKeyToLabel, formatYAxisTick } from "../utils/graphUtils";

// Create a mapping of division names to their shades
const divisionColorMap = divisions.reduce((acc, division) => {
  acc[division.name] = division.shades;
  return acc;
}, {} as Record<string, string[]>);

// Track the current color index per division to assign unique shades
const divisionColorIndexTracker: Record<string, number> = {};
const formatName = (name: string): string => {
  const [division, label] = name.split(" - ");

  if (!label) return name; // In case "-" is not present

  const trimmedLabel = label.trim();
  const formattedLabel =
    trimmedLabel.charAt(0).toUpperCase() + trimmedLabel.slice(1);

  return `${division} - ${formattedLabel}`;
};

const CustomTooltip = ({
  active,
  payload,
  label,
  type = "Expenditure",
}: {
  active?: boolean;
  payload?: any[];
  label?: string;
  type?: string;
}) => {
  

  if (active && payload?.length) {
    // Create category → color map (division-based)
    const categoryColorMap: Record<string, string> = {};
    const divisionTracker: Record<string, number> = {};

    // Ensure consistent order

    payload.forEach((item) => {
      const [division] = item.name.split(" - ");

      const shades = divisionColorMap[division] || ["#ccc"];
      const currentIndex = divisionTracker[division] || 0;
      categoryColorMap[item.name] = shades[currentIndex % shades.length];
      divisionTracker[division] = currentIndex + 1;
    });

    return (
      <div
        style={{
          backgroundColor: "rgba(51, 51, 51, 0.85)",
          padding: "10px 14px",
          borderRadius: "8px",
          color: "#fff",
          fontSize: 12,
        }}
      >
        <div style={{ fontWeight: 600, marginBottom: 6 }}>{label}</div>
        {(type === "Earning" || type === "Expenditure") && (
          <div style={{ fontSize: 10, marginTop: 6, fontWeight: "bold" }}>
            Figures in thousands
          </div>
        )}
        <ul style={{ padding: 0, margin: 0, listStyle: "none", paddingTop: 5 }}>
          {payload.map((item: any, index: number) => {
            const color = item.fill;

            const divisionName = item?.dataKey?.split(" - ")[0] || ""; // "Jaipur"

            return (
              <li
                key={index}
                style={{
                  display: "flex",
                  alignItems: "center",
                  marginBottom: 4,
                }}
              >
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
                <span style={{ color: "#fff" }}>
                  {type != "Recoverable" ? `${divisionName} ` : null}
                  {type != "Recoverable" ? ` - ` : null}
                  {formatName(item.name)}: ₹ {item.value?.toLocaleString()}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    );
  }

  return null;
};

const TrendBarGraph = ({
  uniqueCategories,
  lineData,
  selectedTab,
  color,
  dataDownload,
  month,
  defaultCheckBoxMarked,
  setDefaultCheckBoxMarked,
  graphType,
  varianceData,
}: any) => {
  

  const [loading, setLoading] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const formatNumber = (num: number) => num.toLocaleString("en-IN"); // Adds commas (e.g., 10000 → 10,000)

  // Create stable color mapping for each category
  const categoryColorMap = useMemo(() => {
    const colorMap: Record<string, string> = {};
    const divisionIndexMap: Record<string, number> = {};

    // Sort for stable assignment
    const sortedCategories = [...uniqueCategories].sort();

    sortedCategories.forEach((category) => {
      const [division] = category.split(" - ");
      const shades = [...(divisionColorMap[division] || ["#ccc"])].reverse();
      const shadeIndex = divisionIndexMap[division] || 0;

      colorMap[category] = shades[shadeIndex % shades.length];
      divisionIndexMap[division] = shadeIndex + 1;
    });

    return colorMap;
  }, [uniqueCategories]);

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

  const formatXAxis = (value: string) => {
    // Split the date string (format: MM/YYYY)
    const [month, year] = value.split('/');
    // Convert month number to month name
    const monthName = new Date(2000, parseInt(month) - 1).toLocaleString('default', { month: 'short' });
    return `${monthName}/${year}`;
  };

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
            minHeight: 370,
            width: "100%",
          }}
        >
          <Box
            sx={{
              display: "flex",
              justifyContent: "flex-start",
              width: "100%",

              overflowX: "auto",
              whiteSpace: "nowrap",
              scrollbarColor: "#555 #000",
              "&::-webkit-scrollbar": {
                height: 4,
              },
              "&::-webkit-scrollbar-track": {
                backgroundColor: "#000",
                borderRadius: 10,
              },
              "&::-webkit-scrollbar-thumb": {
                backgroundColor: "#555",
                borderRadius: 10,
              },
              "&::-webkit-scrollbar-thumb:hover": {
                backgroundColor: "#888",
              },
            }}
          >
            {uniqueCategories.map((category: any, index: any) => {
              const [division] = category.split(" - ");
              const shades = divisionColorMap[division] || ["#ccc"];
              const colorIndex = divisionColorIndexTracker[division] || 0;
              const color = shades[colorIndex % shades.length];
              divisionColorIndexTracker[division] = colorIndex + 1;

              return (
                <Box
                  key={index}
                  sx={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                    mx: 1,
                    cursor: "pointer",
                  }}
                  onClick={() => {
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
                      backgroundColor: categoryColorMap[category],
                    }}
                  />

                  <Typography
                    variant="body2"
                    fontSize={12}
                    fontWeight={600}
                    color={categoryColorMap[category]}
                    sx={{
                      fontFamily: "MyCustomFont,SourceSerif4_18pt",
                      textTransform: "none",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {division} {"-"}{" "}
                    {formatKeyToLabel(category.split(" - ")[1])}
                  </Typography>
                </Box>
              );
            })}
          </Box>

          <ResponsiveContainer
            width="96%"
            height={"75%"}
            style={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <BarChart
              data={lineData}
              margin={{ top: 0, bottom: 40 }}
              style={{ cursor: "pointer" }}
            >
              <XAxis
                dataKey="date"
                tick={{ fill: "#fff", fontSize: 12, color: "#fff" }}
                tickFormatter={formatXAxis}
                padding={{ left: 40, right: 20 }}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis
                tickFormatter={(value) => formatYAxisTick(value, graphType)}
                tick={{ fill: "white", fontSize: 12 }}
              />
              <CartesianGrid
                stroke="#E0E0E0"
                strokeWidth={1}
                vertical={false}
              />
              <Tooltip
                content={(props) => (
                  <CustomTooltip {...props} type={graphType} />
                )}
                wrapperStyle={{ outline: "none" }}
                contentStyle={{
                  backgroundColor: "transparent",
                  border: "none",
                  boxShadow: "none",
                }}
                cursor={{ fill: "rgba(255, 255, 255, 0.1)" }}
              />
              // Inside your BarChart JSX
              {uniqueCategories.map((category: any) => {
                const [division] = category.split(" - ");
                const shades = divisionColorMap[division] || ["#ccc"]; // Fallback color

                // Get next available shade index
                const colorIndex = divisionColorIndexTracker[division] || 0;
                const color = shades[colorIndex % shades.length];
                divisionColorIndexTracker[division] = colorIndex + 1; // Update tracker

                return (
                  <Bar
                    key={category}
                    name={formatKeyToLabel(category)}
                    dataKey={category}
                    fill={categoryColorMap[category]}
                    barSize={30}
                  />
                );
              })}
            </BarChart>
          </ResponsiveContainer>
        </Grid>
      </Box>
    </>
  );
};

export default TrendBarGraph;