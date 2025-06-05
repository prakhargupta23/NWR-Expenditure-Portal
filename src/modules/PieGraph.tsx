import {
  Backdrop,
  Box,
  CircularProgress,
  Typography,
  useMediaQuery,
} from "@mui/material";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import DownloadButton from "./Button";
import "../Home.css";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { useState } from "react";
import { sqlService } from "../services/sqldata.service";
import { getMonthYear } from "../utils/otherUtils";
const CATEGORY_STYLES = [
  { bg: "#FFFAE8", text: "#9A7B14", dot: "#FFD23D" },
  { bg: "#F4EEFF", text: "#6320EE", dot: "#6320EE" },
  { bg: "#FFEEEA", text: "#9A3215", dot: "#F45428" },
  { bg: "#E8F8FF", text: "#005682", dot: "#00A6FB" },
  { bg: "#F0F8EA", text: "#3D6B00", dot: "#77C043" },
];

function PieGraph({
  uniqueCategories,
  pieData,
  selectedTab,
  color,
  dataDownload,
  month,
  graphType,
}: any) {
  const isSmallScreen = useMediaQuery("(max-width: 700px)"); // Detects small screens
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [loading, setLoading] = useState(false);

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
          <p
            style={{
              color: fill,
              margin: 0,
              fontFamily: "MyCustomFont,SourceSerif4_18pt",
              textTransform: "none",
            }}
          >
            {`${name}: ${selectedTab === "amount" ? "₹" : ""}${
              Number.isInteger(value) ? value : value?.toFixed(2)
            }`}
          </p>
        </div>
      );
    }
    return null;
  };
  async function downloadData(month: any, graphType: string, name: string) {
    try {
      setLoading(true);
      setSnackbarOpen(true);
      setSnackbarMessage("Downloading data...");

      const monthData = getMonthYear(month.month, month.year);

      let data = {
        month: monthData,
        categoryType: graphType ? graphType.toLowerCase() : "",
        pieDataType: name,
      };
      console.log(data);

      // Fetch data from the service

      const response = await sqlService.downloadPieCsvData(data); // Adjust this function as needed
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
          justifyContent: "space-between",

          width: "100%",
          marginLeft: "5%",
          marginRight: "5%",
          mt: 2,
          mb: 2,
        }}
      >
        {uniqueCategories.map((category: any, index: any) => (
          <Box
            key={index}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: { lg: "5px", md: "2px", sm: "0px" },
              mx: 1,
            }} // Adds spacing between items
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
            <Typography
              variant="body2"
              fontSize={{ xs: 10, lg: 14, sm: 10 }}
              color={color}
              fontWeight="600"
              marginLeft={1}
              sx={{
                fontFamily: "MyCustomFont,SourceSerif4_18pt",
                textTransform: "none",
              }}
            >
              {category}
            </Typography>
          </Box>
        ))}
      </Box>
      <ResponsiveContainer width="100%" height={isSmallScreen ? "55%" : "75%"}>
        {/* Reduced height */}
        <PieChart>
          <Pie
            data={pieData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            style={{ cursor: "pointer" }}
            fontSize={16}
            outerRadius={100}
            innerRadius={50}
            label={({ name, value }) =>
              `${name}: ${selectedTab === "amount" ? "₹" : ""}${value.toFixed(
                0
              )}`
            }
            onClick={(event, index) => {
              if (dataDownload) {
                downloadData(month, graphType, event.name);
              }
            }}
          >
            {pieData.length > 0 &&
              pieData.map((_: any, index: any) => (
                <Cell
                  key={`cell-${index}`}
                  fill={CATEGORY_STYLES[index % CATEGORY_STYLES.length].dot}
                />
              ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
    </>
  );
}

export default PieGraph;
