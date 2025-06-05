import React, { useState } from "react";
import {
  Typography,
  Button,
  Container,
  Grid,
  Paper,
  IconButton,
  Box,
  MenuItem,
  Select,
  CircularProgress,
  Snackbar,
  Modal,
} from "@mui/material";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

import "../Home.css";
import { csvService } from "../services/csv.service";
import { Chart, registerables } from "chart.js";
import AiChat from "../modules/AiChat";
import Delete from "@mui/icons-material/Delete";
import Papa from "papaparse";
import Basic from "../Components/Basic";
import DynamicFormModal from "../modules/PromptModal";

import { CsvModal } from "../modules/CsvModal";
import { sqlService } from "../services/sqldata.service";
import TopAppBar from "../modules/TopAppBar";
import Expenditure from "../Components/Pfa/Expenditure";
import Recoverable from "../Components/Pfa/Recoverable";
import PerformanceIndex from "../Components/Pfa/PerformanceIndex";
import OriginatingEarnings from "../Components/Pfa/OriginatingEarnings";
import PHExpenditure from "../Components/Pfa/PHExpenditure";
import LeaderBoard from "../modules/LeaderBoard";
import { humanLabel, sheetOptions } from "../utils/staticDataUtis";

import { formatHeader, formatSheetName } from "../utils/otherUtils";
import SheetTable from "../Components/Pfa/SheetTable";
import NewsFeed from "../modules/NewsFeed";
Chart.register(...registerables);
const MONTHS = [
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
const renderComponent = (
  categoryType: any,
  reloadGraph: any,
  pieData: any,
  setPieData: any,
  setDataLoading: any
) => {
  switch (categoryType) {
    case "Expenditure":
    case "Earning":
      return (
        <Expenditure
          type={categoryType}
          reloadGraph={reloadGraph}
          setPieData={setPieData}
          setDataLoading={setDataLoading}
        />
      );
    case "PHExpenditure":
      return (
        <PHExpenditure />
      );
    case "Recoverable":
      return <Recoverable type={categoryType} reloadGraph={reloadGraph} />;
    case "PerformanceIndex":
      return (
        <PerformanceIndex
          getDivisionName={(division: string) => `Division ${division}`}
        />
      );
    case "OriginatingEarnings":
      return (
        <OriginatingEarnings
          getDivisionName={(division: string) => `Division ${division}`}
        />
      );

    default:
      return <SheetTable sheetName={categoryType} />;
  }
};

const logoImage = require("../assets/logo.png");

export default function PFAPage() {
  const [selectedButton, setSelectedButton] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [openPromptModal, setOpenPromptModal] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);
  const [reloadGraph, setReloadGraph] = useState(false);

  const [categoryType, setCategoryType] = useState("Expenditure");
  const [selectedMonth, setSelectedMonth] = useState<string>(
    MONTHS[new Date().getMonth()]
  );
  const [openCsvModal, setOpenCsvModal] = useState(false);
  const [pieData, setPieData] = useState<any[]>([]);
  const [open, setOpen] = useState(false);

  const [csvToUpload, setCsvToUpload] = useState("");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedDateForModal, setSelectedDateForModal] = useState({
    month: "January",
    year: new Date().getFullYear(),
  });
  const [csvDownloading, setCsvDownloading] = useState(false);
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

  const allYears = Array.from(
    { length: 10 },
    (_, i) => new Date().getFullYear() - i
  );

  const handleDateChange = (field: any, value: any) => {
    setSelectedDateForModal((prev) => ({ ...prev, [field]: value }));
  };
  const handleClose = () => setOpen(false);

  const [deleteLoading, setDeleteLoading] = useState(false);
  const handleDropdownChange = (event: any) => {
    setCategoryType(event.target.value);
  };
  // Fetch Data

  // Handle File Upload
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const csvData = reader.result as string;
        //        parseCSV(csvData);

        // Reset the file input field so the same file can be reselected
        event.target.value = "";
      };
      reader.readAsText(file);
    }
  };

  const parseCSVSbi = async (data: string) => {
    const result: any[] = [];

    setLoading(true);

    // Mapping CSV column names to database fields
    const columnMapping: Record<string, string> = {
      ACCOUNT_NUMBER: "accountNumber",
      NAME: "name",
      PPO_NUMBER: "ppoNumber",
      DATE_OF_BIRTH: "dateOfBirth",
      DATE_START: "dateStart",
      PENSION_TYPE: "pensionType",
      DATE_OF_RETIREMENT: "dateOfRetirement",
    };
    Papa.parse(data, {
      header: true, // Automatically uses first row as headers
      skipEmptyLines: true,
      complete: async (parsedData) => {
        const rows: any[] = parsedData.data;

        for (const row of rows) {
          const obj: Record<string, any> = {}; // Keep values as they are

          for (const key in row) {
            // Directly map CSV headers to database fields without altering values
            const mappedKey = columnMapping[key] || key; // Use original key if not in mapping
            obj[mappedKey] = row[key]; // Store value as is
          }

          result.push(obj);
        }

        try {
          let response;

          // Send raw data to overview
          response = await csvService.insertSbiCsvData(
            result,

            selectedMonth
          );

          setSnackbarOpen(true);
          setSnackbarMessage(response.message);
          // fetchData(); // Reload data
        } catch (error: any) {
          console.error(error.message);
          setSnackbarOpen(true);
          setSnackbarMessage(error.message);
        }
        setReloadGraph(!reloadGraph);
        setLoading(false);
      },
    });
  };

  // Handle File Upload
  const handleFileSelectForSbi = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const csvData = reader.result as string;
        parseCSVSbi(csvData);

        // Reset the file input field so the same file can be reselected
        event.target.value = "";
      };
      reader.readAsText(file);
    }
  };
  // Handle Arpan/Debit Button Click
  const handleButtonClick = (type: string) => {
    setSelectedButton(type);
    document.getElementById("csv-file-input")?.click();
  };
  const handleButtonClickForSbi = () => {
    //setSelectedButton(type);
    document.getElementById("sbicsv-file-input")?.click();
  };

  // Close Snackbar
  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };
  // Toggle between Line and Bar chart

  async function refreshSqlData() {
    try {
      setDeleteLoading(true);
      const response = await csvService.deleteSql();

      if (response.success) {
        setSnackbarOpen(true);
        setSnackbarMessage(response.message);
        //   setArpanData([]);
        //fetchData();
      } else {
        setSnackbarOpen(true);
        setSnackbarMessage("Some error has happened");
      }
    } catch (error: any) {
      setSnackbarOpen(true);
      setSnackbarMessage(error.message);
    } finally {
      setReloadGraph(true);
      setDeleteLoading(false);
      setDeleteModalOpen(false);
    }
  }
  async function downloadCsvData() {
    try {
      setCsvDownloading(true);
      const response = await sqlService.downloadCsvData();
      console.log("this is download csv response");
      console.log(response);

      const { sbiMaster, debitScroll } = response;

      const sbiKeys = Object.keys(sbiMaster[0]);
      const debitKeys = Object.keys(debitScroll[0]);

      // Combine column headers
      const columnHeaders = [...sbiKeys, ...debitKeys];

      // Combine data rows
      const dataRows = sbiMaster.map((sbiRow: any, index: any) => {
        const debitRow = debitScroll[index] || {};
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
      saveAs(blob, "unlinked-data.csv");

      setSnackbarOpen(true);
      setSnackbarMessage("CSV has been downloaded");
    } catch (error: any) {
      console.error(error);
      setSnackbarOpen(true);
      setSnackbarMessage(error.message || "Something went wrong");
    } finally {
      setCsvDownloading(false);
    }
  }

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh", // Full viewport height
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#101319",
        alignItems: "center",
        overflowY: "hidden",
        paddingBottom: "10px",
        overflowX: "hidden",
      }}
    >
      <TopAppBar
        setDeleteModalOpen={(open) => setDeleteModalOpen(open)}
        deleteLoading={deleteLoading}
        setOpenCsvModal={(open) => setOpenCsvModal(open)}
        setCsvToUpload={(type) => setCsvToUpload(type)}
        setOpen={(open) => setOpen(open)}
        csvDownloading={csvDownloading}
        downloadCsvData={downloadCsvData}
        openPromptModal={openPromptModal}
        setOpenPromptModal={(open) => setOpenPromptModal(open)}
        extraButton={true}
        reloadGraph={reloadGraph}
        setReloadGraph={setReloadGraph}
      />
      {/* Main Content Section */}
      <Box
        sx={{
          width: "95%",
          height: "calc(100% - 78px)", // Subtracts AppBar height from total height
          marginTop: "20px",
        }}
      >
        <Grid
          container
          spacing={2}
          sx={{
            height: "100%",
            display: "flex",
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
            // overflow: "hidden",
            paddingBottom: "10px",
          }}
        >
          {/* Left Section (Graph) */}
          <Grid
            item
            xs={12}
            md={
              categoryType === "Earning" || categoryType === "Expenditure"
                ? 5
                : 6
            }
            sx={{
              display: "flex",
              flexDirection: "column",
              width: "100%",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            {/* Pension Graph Title */}
            <Box
              sx={{
                width: "100%",
                display: "flex",
                flexDirection: "row",
                justifyContent: "flex-start",
                alignItems: "center",

                padding: 0,
              }}
            >
              <Select
                value={categoryType}
                onChange={handleDropdownChange}
                sx={{
                  background: "linear-gradient(90deg, #7B2FF7, #9F44D3)",
                  borderRadius: "10px",
                  height: "40px",
                  padding: "12px",
                  fontWeight: "600",
                  color: "#fff",
                  justifyContent: "space-between",
                  display: "flex",
                  alignItems: "center",

                  width: "197px",
                  fontFamily: "MyCustomFont,SourceSerif4_18pt",
                  marginBottom: "16px",
                  "& .MuiSelect-icon": {
                    color: "#fff",
                  },
                }}
                MenuProps={{
                  PaperProps: {
                    sx: {
                      backgroundColor: "#36314f", // Black background for dropdown
                      color: "#fff", // White text color
                    },
                  },
                }}
              >
                {sheetOptions.map((opt) => (
                  <MenuItem key={opt} value={opt}>
                    {formatSheetName(opt)}
                  </MenuItem>
                ))}
              </Select>
            </Box>
            <Paper
              elevation={3}
              sx={{
                display: "flex",
                height: "74vh",
                flexDirection: "column",
                borderRadius: "12px",
                width: "100%",
                justifyContent: "flex-start",
                backgroundColor: "#161921",
                alignItems: "center",
                border: "1px solidrgb(251, 249, 252)",
                overflowY: "auto",
                overflowX: "hidden",
                padding: "10px 10px 10px 10px",
                "&::-webkit-scrollbar": {
                  display: "none",
                },
                "&": {
                  msOverflowStyle: "none",
                  scrollbarWidth: "none",
                },
              }}
            >
              {renderComponent(
                categoryType,
                reloadGraph,
                pieData,
                setPieData,
                setDataLoading
              )}
            </Paper>
          </Grid>
          
          {/* Leaderboard and News Feed section - only shown for Expenditure and Earning */}
          {(categoryType === "Expenditure" || categoryType === "Earning") && (
            <Grid
              item
              xs={12}
              md={3}
              sx={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                height: "100%",
                width: "100%",
                overflowY: "auto",
                overflowX: "hidden",
                "&::-webkit-scrollbar": {
                  display: "none",
                },
                "&": {
                  msOverflowStyle: "none",
                  scrollbarWidth: "none",
                },
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  height: "100%",
                  width: "100%",
                }}
              >
                <Box sx={{ flex: 1, overflow: "hidden" }}>
                  <LeaderBoard
                    data={pieData}
                    dataLoading={dataLoading}
                    categoryType={categoryType}
                  />
                </Box>

                <Box sx={{ flex: 1, overflow: "hidden", mt: 1 }}>
                  <NewsFeed />
                </Box>
              </Box>
            </Grid>
          )}
          
          {/* Chat Section */}
          <Grid
            item
            xs={12}
            md={
              categoryType === "Earning" || categoryType === "Expenditure"
                ? 4
                : 6
            }
            sx={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              height: "100%",
            }}
          >
            <AiChat pageNmae="pfa" />
          </Grid>
        </Grid>
      </Box>

      {/* File Input */}
      <input
        id="csv-file-input"
        type="file"
        accept=".csv, .xls, .xlsx"
        style={{ display: "none" }}
        onChange={handleFileSelect}
      />
      <input
        id="sbicsv-file-input"
        type="file"
        accept=".csv, .xls, .xlsx"
        style={{ display: "none" }}
        onChange={handleFileSelectForSbi}
      />

      {/* Snackbar Notification */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={5000}
        onClose={handleCloseSnackbar}
        message={snackbarMessage}
      />
      <Modal open={open} onClose={handleClose}>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 480,
            bgcolor: "background.paper",
            boxShadow: 24,
            p: 4,
            borderRadius: "12px",
            display: "flex",
            flexDirection: "column",
            gap: 2,
          }}
        >
          <Typography
            variant="h6"
            align="center"
            sx={{
              fontWeight: 600,
              fontFamily: "MyCustomFont,SourceSerif4_18pt",
            }}
          >
            Upload CSV Data
          </Typography>

          <Grid container spacing={2}>
            {csvToUpload === "arpan" && (
              <>
                {/* Month Selection */}
                <Grid item xs={6}>
                  <Select
                    value={selectedDateForModal.month}
                    onChange={(e) => handleDateChange("month", e.target.value)}
                    displayEmpty
                    fullWidth
                    sx={{
                      backgroundColor: "#F6EFFD",
                      borderRadius: "10px",
                      height: "40px",
                    }}
                  >
                    <MenuItem value="" disabled>
                      Select Month
                    </MenuItem>
                    {allMonths.map((month, index) => (
                      <MenuItem key={index} value={month}>
                        {month}
                      </MenuItem>
                    ))}
                  </Select>
                </Grid>

                {/* Year Selection */}
                <Grid item xs={6}>
                  <Select
                    value={selectedDateForModal.year}
                    onChange={(e) => handleDateChange("year", e.target.value)}
                    fullWidth
                    sx={{
                      backgroundColor: "#F6EFFD",
                      borderRadius: "10px",
                      height: "40px",
                    }}
                  >
                    {allYears.map((year, index) => (
                      <MenuItem key={index} value={year}>
                        {year}
                      </MenuItem>
                    ))}
                  </Select>
                </Grid>
              </>
            )}

            {/* File Upload Section (If Needed) */}

            {/* Buttons */}
            <Grid item xs={12}>
              {loading ? (
                <Container
                  sx={{
                    width: "100%",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <CircularProgress />
                </Container>
              ) : (
                <Button
                  variant="contained"
                  fullWidth
                  onClick={() =>
                    csvToUpload === "arpan"
                      ? handleButtonClick("Arpan")
                      : handleButtonClickForSbi()
                  }
                  sx={{
                    // backgroundColor: "#6200EA",
                    color: "white",
                    borderRadius: "8px",
                    fontWeight: 600,
                    textTransform: "none",
                    fontFamily: "MyCustomFont,SourceSerif4_18pt",

                    // "&:hover": {
                    //   backgroundColor: "#4B00B5",
                    // },
                  }}
                >
                  {csvToUpload === "arpan"
                    ? "Upload Debit Scroll"
                    : "Upload Sbi Data"}
                </Button>
              )}
            </Grid>
          </Grid>
        </Box>
      </Modal>

      <DynamicFormModal
        openPromptModal={openPromptModal}
        setOpenPromptModal={setOpenPromptModal}
      />
      <Modal open={deleteModalOpen} onClose={handleClose}>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 400,
            bgcolor: "background.paper",
            boxShadow: 24,
            p: 3,
            borderRadius: 2,
            textAlign: "center",
          }}
        >
          <Typography
            variant="h6"
            sx={{ mb: 2, fontFamily: "MyCustomFont,SourceSerif4_18pt" }}
          >
            Are you sure you want to delete all the debit scroll data?
          </Typography>
          <Box sx={{ display: "flex", justifyContent: "center", gap: 2 }}>
            {deleteLoading ? (
              <IconButton sx={{ color: "white", minWidth: 40, minHeight: 40 }}>
                <CircularProgress size={24} />
              </IconButton>
            ) : (
              <Button
                variant="contained"
                color="error"
                onClick={refreshSqlData}
                startIcon={<Delete />}
              >
                Delete
              </Button>
            )}
            <Button
              variant="outlined"
              onClick={() => setDeleteModalOpen(false)}
            >
              Cancel
            </Button>
          </Box>
        </Box>
      </Modal>
      <CsvModal
        setOpenCsvModal={setOpenCsvModal}
        setReloadGraph={setReloadGraph}
        reloadGraph={reloadGraph}
        openCsvModal={openCsvModal}
      />
    </div>
  );
}
function setLoading(arg0: boolean) {
  throw new Error("Function not implemented.");
}
