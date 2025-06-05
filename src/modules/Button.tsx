import React, { useState } from "react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { CircularProgress, Container, IconButton } from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import { sqlService } from "../services/sqldata.service";
import { getMonthYear } from "../utils/otherUtils";

interface DownloadButtonProps {
  selectedDate: any;
}

const DownloadButton = ({ selectedDate }: DownloadButtonProps) => {
  const [loading, setLoading] = useState(false);
  const handleDownload = async () => {
    try {
      setLoading(true);
      const month = getMonthYear(selectedDate.month, selectedDate.year);
      const response = await sqlService.downloadTotalCsvData(month);
      console.log(response);

      // Extract data correctly from response
      const {
        summaryData: {
          newPensioner,
          stoppedPensioner,
          basicOverPayment,
          basicUnderPayment,
          commutationOverPayment,
          commutationUnderPayment,
          pensionData,
          ageCsvData,
          regularToFamilyTransitionData,
          others,
        },
        newPensionerData, // Now correctly extracted at the root level
        stoppedPensionerData,
        regularToFamilyData,
        basicOverPaymentData,
        basicUnderPaymentData,
        commutationOverPaymentData,
        commutationUnderPaymentData,
        ageData,
      } = response.data;

      // Format previous month
      const [monthValue, year] = month.split("/").map(Number);
      const date = new Date(year, monthValue - 1, 1);
      date.setMonth(date.getMonth() - 1);
      const monthNames = [
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

      const previousMonth = `${
        monthNames[date.getMonth()]
      } ${date.getFullYear()}`;
      const currentMonth = `${monthNames[monthValue - 1]} ${year}`;
      // Pension Report Data (First Sheet)
      const worksheetData = [
        [
          `Here is the report of the monthly difference in pension payout between ${previousMonth} and ${currentMonth}:`,
        ],
        [],
        [
          "Total Pension for " + previousMonth + ":",
          `${pensionData.previousPension.toFixed(2)}`,
        ],
        [
          `Total Pension for ${currentMonth}:`,
          `${pensionData.currentPension.toFixed(2)}`,
        ],
        ["Difference:", `${pensionData.difference.toFixed(2)}`],
        [],
        ["Here is the comprehensive report"],
        [],
        ["", "Amount", "% contributed"],
        [
          "New pensioners",
          `${newPensioner.amount}`,
          `${newPensioner.contributed}%`,
        ],
        [
          "Stopped pensioners",
          `${stoppedPensioner.amount}`,
          `${stoppedPensioner.contributed}%`,
        ],
        [
          "Basic Overpayment",
          `${basicOverPayment.amount}`,
          `${basicOverPayment.contributed}%`,
        ],
        [
          "Basic Underpayment",
          `${basicUnderPayment.amount}`,
          `${basicUnderPayment.contributed}%`,
        ],
        [
          "Commutation Overpayment",
          `${commutationOverPayment.amount}`,
          `${commutationOverPayment.contributed}%`,
        ],
        [
          "Commutation Underpayment",
          `${commutationUnderPayment.amount}`,
          `${commutationUnderPayment.contributed}%`,
        ],
        [
          "Regular to Family",
          `${regularToFamilyTransitionData.amount}`,
          `${regularToFamilyTransitionData.contributed}%`,
        ],
        ["80+ addition", `${ageCsvData.amount}`, `${ageCsvData.contributed}%`],
        ["Active Pensioners", `${others.amount}`, `${others.contributed}%`],
      ];
      let ws1 = XLSX.utils.aoa_to_sheet(worksheetData);
      // Auto-adjust column widths based on max content length
      ws1["!cols"] = worksheetData[0].map((_, colIndex) => {
        const maxLength = Math.max(
          ...worksheetData.map((row) =>
            row[colIndex] ? row[colIndex].toString().length : 0
          )
        );
        return { wch: maxLength }; // +5 for padding
      });

      // Extract column headers dynamically from the first object in newPensionerData
      const keys =
        newPensionerData?.length > 0 ? Object.keys(newPensionerData[0]) : [];

      // Create the Excel data array
      const newPensionerExcelData = [
        keys, // First row: Dynamic column headers
        ...newPensionerData.map((data: any) => keys.map((key) => data[key])), // Rows: Data values
      ];

      // Debugging: Log the final structure before creating the sheet
      console.log("Final Excel Data Structure:", newPensionerExcelData);

      const ws2 = XLSX.utils.aoa_to_sheet(newPensionerExcelData);
      // Extract column headers dynamically from the first object in newPensionerData
      const stoppedPensionerkeys =
        stoppedPensionerData?.length > 0
          ? Object.keys(stoppedPensionerData[0])
          : [];

      // Create the Excel data array
      const stoppedPensionerExcelData = [
        stoppedPensionerkeys, // First row: Dynamic column headers
        ...stoppedPensionerData.map((data: any) =>
          keys.map((key) => data[key])
        ), // Rows: Data values
      ];

      const ws3 = XLSX.utils.aoa_to_sheet(stoppedPensionerExcelData);
      console.log("this is data");
      console.log(basicOverPaymentData);

      // Extract column headers dynamically from the first object in newPensionerData
      const basicOverPaymentDataKeys =
        basicOverPaymentData?.length > 0
          ? Object.keys(basicOverPaymentData[0])
          : [];

      // Create the Excel data array
      const basicOverPaymentDataExcelData = [
        basicOverPaymentDataKeys, // First row: column headers
        ...basicOverPaymentData.map((data: any) =>
          basicOverPaymentDataKeys.map((key) => data[key])
        ), // Data rows
      ];

      // commutation
      const commutationOverPaymentDataKeys =
        commutationOverPaymentData?.length > 0
          ? Object.keys(commutationOverPaymentData[0])
          : [];

      console.log("this is data");
      console.log(commutationOverPayment);
      // Create the Excel data array
      const commutationOverPaymentExcelData = [
        commutationOverPaymentDataKeys, // First row: column headers
        ...commutationOverPaymentData.map((data: any) =>
          commutationOverPaymentDataKeys.map((key) => data[key])
        ), // Data rows
      ];
      console.log("this is data");
      console.log(commutationOverPaymentExcelData);

      console.log(basicOverPaymentDataExcelData);

      const ws5 = XLSX.utils.aoa_to_sheet(basicOverPaymentDataExcelData);

      const ws7 = XLSX.utils.aoa_to_sheet(commutationOverPaymentExcelData);
      // Extract column headers dynamically from the first object in newPensionerData
      const regularToFamilyDataKeys =
        regularToFamilyData?.length > 0
          ? Object.keys(regularToFamilyData[0])
          : [];

      // Create the Excel data array
      const regularToFamilyDataExcelData = [
        regularToFamilyDataKeys, // First row: Dynamic column headers
        ...regularToFamilyData.map((data: any) =>
          regularToFamilyDataKeys.map((key) => data[key])
        ), // Rows: Data values
      ];

      const ws4 = XLSX.utils.aoa_to_sheet(regularToFamilyDataExcelData);

      console.log("this is data");
      console.log(basicUnderPaymentData);
      // Extract column headers dynamically from the first object in newPensionerData
      const basicUnderPaymentDataKeys =
        basicUnderPaymentData?.length > 0
          ? Object.keys(basicUnderPaymentData[0])
          : [];
      // Create the Excel data array
      const basicUnderPaymentDataExcelData = [
        basicUnderPaymentDataKeys, // First row: column headers
        ...basicUnderPaymentData.map((data: any) =>
          basicUnderPaymentDataKeys.map((key) => data[key])
        ), // Data rows
      ];
      console.log("this is data");
      console.log(commutationUnderPayment);
      // Extract column headers dynamically from the first object in newPensionerData
      const commutationUnderPaymentDataKeys =
        commutationUnderPaymentData?.length > 0
          ? Object.keys(commutationUnderPaymentData[0])
          : [];
      // Create the Excel data array
      const commutationUnderPaymentExcelData = [
        commutationUnderPaymentDataKeys, // First row: column headers
        ...commutationUnderPaymentData.map((data: any) =>
          commutationUnderPaymentDataKeys.map((key) => data[key])
        ), // Data rows
      ];

      // commutation

      const ws6 = XLSX.utils.aoa_to_sheet(basicUnderPaymentDataExcelData);

      const ws8 = XLSX.utils.aoa_to_sheet(commutationUnderPaymentExcelData);

      // Extract column headers dynamically from the first object in newPensionerData
      const ageDataKeys = ageData?.length > 0 ? Object.keys(ageData[0]) : [];

      // Create the Excel data array
      const ageExcelData = [
        ageDataKeys, // First row: Dynamic column headers
        ...ageData.map((data: any) => ageDataKeys.map((key) => data[key])), // Rows: Data values
      ];

      const ws9 = XLSX.utils.aoa_to_sheet(ageExcelData);
      // Create workbook and append sheets
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws1, "Pension Report");
      XLSX.utils.book_append_sheet(wb, ws2, "New Pensioner");
      XLSX.utils.book_append_sheet(wb, ws3, "Stopped Pensioner");
      XLSX.utils.book_append_sheet(wb, ws4, "Regular To Family");
      XLSX.utils.book_append_sheet(wb, ws5, "Basic Overpayment");
      XLSX.utils.book_append_sheet(wb, ws6, "Basic Underpayment");
      XLSX.utils.book_append_sheet(wb, ws7, "Commutation Overpayment");
      XLSX.utils.book_append_sheet(wb, ws8, "Commutation Underpayment");
      XLSX.utils.book_append_sheet(wb, ws9, "80 + age");
      // Write and trigger download
      const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      const blob = new Blob([wbout], { type: "application/octet-stream" });
      saveAs(blob, "pension-report.xlsx");
    } catch (error) {
      console.error("Error generating report:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {loading ? (
        <Container>
          <CircularProgress />
        </Container>
      ) : (
        <IconButton
          onClick={handleDownload}
          sx={{
            border: "1px solid #000",
            borderRadius: "4px",
            padding: "6px",
            background: "linear-gradient(90deg, #7B2FF7, #9F44D3)",
            color: "white",
            "&:hover": { backgroundColor: "#1565c0" },
          }}
        >
          <DownloadIcon />
        </IconButton>
      )}
    </>
  );
};

export default DownloadButton;
