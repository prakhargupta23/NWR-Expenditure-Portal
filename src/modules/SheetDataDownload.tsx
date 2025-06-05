import React, { useEffect, useState } from "react";
import { saveAs } from "file-saver";

import HTMLtoDOCX from "html-docx-js/dist/html-docx"; // use this import
import CircularProgress from "@mui/material/CircularProgress";
import DownloadIcon from "@mui/icons-material/Download";
import { transactionService } from "../services/transaction.service";
import {
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Modal,
  Select,
  Typography,
} from "@mui/material";
import { months, years } from "../utils/staticDataUtis";
import { getMonthYear, toBase64 } from "../utils/otherUtils";
import { ReportData } from "../interface/reportInterface";
import { generateHTMLContent } from "../utils/ReportTemplate";

const modalStyle = {
  position: "absolute" as const,
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 400,
  bgcolor: "#1e1e1e",
  borderRadius: 2,
  boxShadow: 24,
  p: 4,
  color: "#fff",
};

const DownloadSheetsDoc: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDivision, setSelectedDivision] = useState<string>("Jaipur");
  const [selectedMonth, setSelectedMonth] = useState<string>("January");
  const [selectedYear, setSelectedYear] = useState<number>(
    new Date().getFullYear()
  );

  const handleDownload = async () => {
    try {
      setLoading(true);
      let img = require("../assets/railwayLogo.jpg");
      const base64Image = await toBase64(img); // convert image to base64
      const date = getMonthYear(selectedMonth, selectedYear);

      const reportResponse: ReportData = await transactionService.getReportData(
        date
      );
      console.log("this is response");

      console.log(reportResponse);

      if (reportResponse.success) {
        let data = reportResponse.data;
        const htmlContentPromise = generateHTMLContent(
          base64Image,
          selectedMonth,
          selectedYear,
          data.executiveSummaryData,
          data.keyTakeaways,
          data.combinedSummaryData,
          data.charts,
          data.detailedAnalysis,
          data.summaryOfReport
        );

        const htmlContent = await htmlContentPromise;

        // Show HTML preview in new tab
        // const newWindow = window.open("", "_blank");
        // if (newWindow) {
        //   newWindow.document.write(htmlContent);
        //   newWindow.document.close();
        // }

        // To download later, you can uncomment:
        const blob = await HTMLtoDOCX.asBlob(htmlContent, {
          orientation: "portrait",
          margins: { top: 720, right: 720, bottom: 720, left: 720 },
        });
        saveAs(blob, `UserQuery_${selectedMonth}-${selectedYear}.docx`);
        setModalOpen(false);
      }
    } catch (e) {
      console.error("DOCX generation failed:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log("selectedmonth");
    console.log(selectedMonth);
  }, [selectedMonth]);
  return (
    <>
      <Button
        startIcon={<DownloadIcon />}
        onClick={() => setModalOpen(true)}
        variant="contained"
        sx={{
          bgcolor: "#B72BF8",
          borderRadius: "10px",
          height: "50px",
          fontSize: "16px",
          fontFamily: "MyCustomFont,SourceSerif4_18pt",
          textTransform: "none",
        }}
      >
        Download Report
      </Button>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
        <Box sx={modalStyle}>
          <Typography variant="h6" gutterBottom>
            Select Filters
          </Typography>
          <Typography>Select Month</Typography>
          <FormControl fullWidth size="small" sx={{ mb: 2 }}>
            <Select
              value={selectedMonth}
              label="Select Month"
              sx={{
                bgcolor: "#282828",
                borderRadius: "10px",
                height: "38px",
                color: "#fff",
                border: "1px solid white",
                "& .MuiSelect-icon": { color: "#fff" },
                "& .MuiOutlinedInput-notchedOutline": { borderColor: "white" },
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                  borderColor: "white",
                },
              }}
              MenuProps={{
                PaperProps: {
                  sx: { bgcolor: "#282828", color: "#fff" },
                },
              }}
              onChange={(e: any) => setSelectedMonth(e.target.value)}
            >
              {months.map((month, index) => (
                <MenuItem key={index} value={month}>
                  {month}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Typography>Select Year</Typography>
          <FormControl fullWidth size="small" sx={{ mb: 3 }}>
            <Select
              value={selectedYear}
              label="Select Year"
              sx={{
                bgcolor: "#282828",
                borderRadius: "10px",
                height: "38px",
                color: "#fff",
                border: "1px solid white",
                "& .MuiSelect-icon": { color: "#fff" },
                "& .MuiOutlinedInput-notchedOutline": { borderColor: "white" },
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                  borderColor: "white",
                },
              }}
              MenuProps={{
                PaperProps: {
                  sx: { bgcolor: "#282828", color: "#fff" },
                },
              }}
              onChange={(e: any) => setSelectedYear(e.target.value)}
            >
              {years.map((year) => (
                <MenuItem key={year} value={year}>
                  {year}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Box display="flex" justifyContent="flex-end">
            <Button
              variant="contained"
              onClick={handleDownload}
              disabled={loading}
              sx={{
                bgcolor: "#B72BF8",
                borderRadius: "10px",
                height: "40px",
                fontSize: "14px",
                textTransform: "none",
              }}
            >
              {loading ? (
                <CircularProgress size={20} style={{ color: "#fff" }} />
              ) : (
                "Download"
              )}
            </Button>
          </Box>
        </Box>
      </Modal>
    </>
  );
};

export default DownloadSheetsDoc;
