import React, { useState } from "react";
import {
  Button,
  Modal,
  Box,
  Typography,
  Grid,
  IconButton,
  Select,
  MenuItem,
  Snackbar,
  CircularProgress,
  Container,
  Divider,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

import UploadIcon from "@mui/icons-material/Upload";
import Papa from "papaparse";
import { csvService } from "../services/csv.service";
const columnMapping: Record<string, string> = {
  "File no.": "fileNo",
  "Date of Transaction": "dateOfTransaction",
  "Transaction ID": "transactionId",
  "Type of pension (R, F..": "typeOfPension",
  "Original Pensioner Name": "originalPensionerName",
  "New PPO no.": "newPPONo",
  "Old PPO no.": "oldPPONo",
  "Current Pensioner Name": "currentPensionerName",
  "ailway Dept.": "railwayDept",
  "Month of pension": "monthOfPension",
  "Basic Pension Amount": "basicPensionAmount",
  "Residual Pension (K-L)": "residualPension",
  "Fix Medical Allowance (FMA)": "fixMedicalAllowance",
  "Add. Pension (80+)": "additionalPension80Plus",
  "DA (on Basic Pension)": "daOnBasicPension",
  "Total Pension": "totalPension",
  Deduction: "deduction",
};
const mapColumnNames = (data: any[]): any[] => {
  return data.map((row) => {
    let formattedRow: any = {};
    Object.keys(row).forEach((key) => {
      const newKey = columnMapping[key] || key; // Keep original key if no mapping exists
      formattedRow[newKey] = row[key];
    });
    return formattedRow;
  });
};

interface CsvModalProps {
  openCsvModal: boolean;
  setOpenCsvModal: (value: boolean) => void;
  reloadGraph: any;
  setReloadGraph: any;
}

interface DSRow {
  "New PPO no.": string;
  "Old PPO no.": string;
  basicCategory?: string;
  basicMismatch?: string | null;
  commutationCategory?: string;
  commutationMismatch?: string | null;
}

interface BasicRow {
  "PPO Number": string;
  "Basic Diff": string;
}

interface CommutationRow {
  "Bank PPO Number": string;
  "Commutation Diff": string;
}
const months = [
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
const years = Array.from({ length: 96 }, (_, i) => 1930 + i);
export const CsvModal: React.FC<CsvModalProps> = ({
  openCsvModal,
  setOpenCsvModal,
  setReloadGraph,
  reloadGraph,
}) => {
  const [files, setFiles] = useState<{
    sbiDebitScroll: File | null;
    unlinked: File | null;
    basic: File | null;
    commutation: File | null;
  }>({
    sbiDebitScroll: null,
    unlinked: null,
    basic: null,
    commutation: null,
  });

  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [csvLoading, setCsvLoading] = useState(false);
  const [month, setMonth] = useState("January");
  const [year, setYear] = useState("2000");
  const handleFileChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    key: keyof typeof files
  ) => {
    const file = event.target.files?.[0] || null;
    setFiles((prev) => ({ ...prev, [key]: file }));
  };

  const handleRemoveFile = (key: keyof typeof files) => {
    setFiles((prev) => ({ ...prev, [key]: null }));
  };

  const parseCSV = async <T,>(file: File | null): Promise<T[]> => {
    return new Promise((resolve, reject) => {
      if (!file) return resolve([]);
      const reader = new FileReader();
      reader.onload = (event) => {
        const csvData = event.target?.result as string;
        Papa.parse<T>(csvData, {
          header: true,
          skipEmptyLines: true,
          complete: (result) => resolve(result.data),
          error: (error: any) => reject(error.message),
        });
      };
      reader.readAsText(file);
    });
  };
  const areAllFilesUploaded = () => {
    return (
      files.sbiDebitScroll !== null &&
      files.unlinked !== null &&
      files.basic !== null &&
      files.commutation !== null
    );
  };
  const handleSubmit = async () => {
    if (!areAllFilesUploaded()) {
      setSnackbarOpen(true);
      setSnackbarMessage("Please upload all required files before submitting.");
      return; // Exit early if validation fails
    }
    try {
      setSnackbarOpen(true);
      setSnackbarMessage(
        "Please do not close the window or your data will be lost"
      );

      setCsvLoading(true);

      const formattedDate = `${String(months.indexOf(month) + 1).padStart(
        2,
        "0"
      )}/${year}`;
      console.log("Selected Date:", formattedDate);

      const ds: DSRow[] = await parseCSV<DSRow>(files.sbiDebitScroll);
      const filteredDS = ds.filter((row) =>
        Object.values(row).some((value) => value.trim() !== "")
      );

      const unlinked: { "Scroll PPO No": string }[] = await parseCSV(
        files.unlinked
      );
      const basic: BasicRow[] = await parseCSV<BasicRow>(files.basic);
      const commutation: CommutationRow[] = await parseCSV<CommutationRow>(
        files.commutation
      );

      const unlinkedSet = new Set(
        unlinked
          .map((row) => row["Scroll PPO No"].trim())
          .filter((ppo) => ppo !== "")
      );

      const basicMap = new Map(
        basic
          .map(
            (row) =>
              [row["PPO Number"].trim(), row["Basic Diff"]] as [string, string]
          )
          .filter(([ppo]) => ppo !== "")
      );

      const commutationMap = new Map(
        commutation
          .map(
            (row) =>
              [row["Bank PPO Number"].trim(), row["Commutation Diff"]] as [
                string,
                string
              ]
          )
          .filter(([ppo]) => ppo !== "")
      );

      const processedDS = filteredDS.map((row) => {
        const newPPO = row["New PPO no."].trim();
        const oldPPO = row["Old PPO no."].trim();

        let basicCategory = "match";
        let basicMismatch: string | null = null;
        if (unlinkedSet.has(newPPO) || unlinkedSet.has(oldPPO)) {
          basicCategory = "unlinked";
        } else if (basicMap.has(newPPO)) {
          basicCategory = "mismatch";
          basicMismatch = basicMap.get(newPPO) || null;
        } else if (basicMap.has(oldPPO)) {
          basicCategory = "mismatch";
          basicMismatch = basicMap.get(oldPPO) || null;
        }

        let commutationCategory = "match";
        let commutationMismatch: string | null = null;
        if (unlinkedSet.has(newPPO) || unlinkedSet.has(oldPPO)) {
          commutationCategory = "unlinked";
        } else if (commutationMap.has(newPPO)) {
          commutationCategory = "mismatch";
          commutationMismatch = commutationMap.get(newPPO) || null;
        } else if (commutationMap.has(oldPPO)) {
          commutationCategory = "mismatch";
          commutationMismatch = commutationMap.get(oldPPO) || null;
        }

        return {
          ...row,
          basicCategory,
          basicMismatch,
          commutationCategory,
          commutationMismatch,
        };
      });
      const formattedDS = mapColumnNames(processedDS); // Apply mapping

      let response = await csvService.insertCsvData(
        formattedDS,
        "arpan",
        formattedDate
      );

      setSnackbarOpen(true);
      setSnackbarMessage(response.message);
      console.log("Processed Data:", formattedDS);
    } catch (error: any) {
      setSnackbarOpen(true);
      setSnackbarMessage(error.message);
      console.error("Error processing CSVs:", error);
    } finally {
      setCsvLoading(false);
      setReloadGraph(!reloadGraph);
    }
  };

  function handleCloseSnackbar() {
    setSnackbarOpen(false);
  }

  return (
    <>
      <Modal open={openCsvModal} onClose={() => setOpenCsvModal(false)}>
        <Box
          sx={{
            p: "24px",
            bgcolor: "#121212",
            color: "white",
            width: 500,
            mx: "auto",
            mt: "2%",
            borderRadius: 2,
            maxHeight: "85vh", // Limit modal height

            border: "1px solid #B72BF8",
          }}
        >
          <Typography
            variant="h5"
            fontWeight="bold"
            sx={{
              mb: 2,
              fontFamily: "MyCustomFont,SourceSerif4_18pt",
              textTransform: "none",
            }}
          >
            Upload CSV Files
          </Typography>
          <Box
            sx={{
              width: "100%",
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-start",
              alignItems: "flex-start",
            }}
          >
            <Typography
              variant="body1"
              sx={{
                mb: 1,
                mt: "32px",
                fontFamily: "MyCustomFont,SourceSerif4_18pt",
                textTransform: "none",
              }}
            >
              Bank Data
            </Typography>
            <Divider
              sx={{
                height: "1px",
                backgroundColor: "#FFFFFF", // White color
                width: "3%", // Full width

                marginTop: "4px",
                opacity: 0.6, // Optional: Slight transparency
              }}
            />
          </Box>
          <Grid container spacing={2} sx={{ marginTop: "12px" }}>
            <Grid item xs={12}>
              <input
                type="file"
                accept=".csv"
                id="upload-sbiDebitScroll"
                style={{ display: "none" }}
                onChange={(e) => handleFileChange(e, "sbiDebitScroll")}
              />
              <label htmlFor="upload-sbiDebitScroll">
                <Button
                  component="span" // Ensures button works as a label
                  variant="contained"
                  fullWidth
                  sx={{
                    bgcolor: "#282828",
                    borderRadius: "10px",
                    color: "#fff",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",

                    padding: "10px 16px",
                    fontFamily: "MyCustomFont,SourceSerif4_18pt",
                    textTransform: "none",
                  }}
                >
                  Debit Scroll
                  <UploadIcon />
                </Button>
              </label>
            </Grid>
          </Grid>

          <Box
            sx={{
              width: "100%",
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-start",
              alignItems: "flex-start",
              mt: "24px",
            }}
          >
            <Typography
              variant="body1"
              sx={{
                fontFamily: "MyCustomFont,SourceSerif4_18pt",
                textTransform: "none",
              }}
            >
              Arpan Data
            </Typography>
            <Divider
              sx={{
                height: "1px",
                backgroundColor: "#FFFFFF", // White color
                width: "3%", // Full width

                marginTop: "4px",
                opacity: 0.6, // Optional: Slight transparency
              }}
            />
          </Box>
          <Grid container spacing={2} sx={{ marginTop: "12px" }}>
            {["unlinked", "basic", "commutation"].map((key: any) => (
              <Grid item xs={4} key={key}>
                <input
                  type="file"
                  accept=".csv"
                  id={`upload-${key}`}
                  style={{ display: "none" }}
                  onChange={(e) => handleFileChange(e, key)}
                />
                <label htmlFor={`upload-${key}`}>
                  <Button
                    component="span" // Ensures button works as a label
                    variant="contained"
                    fullWidth
                    sx={{
                      bgcolor: "#282828",
                      borderRadius: "10px",
                      color: "#fff",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      fontFamily: "MyCustomFont,SourceSerif4_18pt",
                      textTransform: "none",
                      padding: "10px 16px",
                    }}
                  >
                    {key.charAt(0).toUpperCase() + key.slice(1)}
                    <UploadIcon />
                  </Button>
                </label>
              </Grid>
            ))}
          </Grid>

          <Box
            sx={{
              width: "100%",
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-start",
              alignItems: "flex-start",
              mt: "24px",
            }}
          >
            <Typography
              variant="body1"
              sx={{
                fontFamily: "MyCustomFont,SourceSerif4_18pt",
                textTransform: "none",
              }}
            >
              Data month
            </Typography>
            <Divider
              sx={{
                height: "1px",
                backgroundColor: "#FFFFFF", // White color
                width: "3%", // Full width

                marginTop: "4px",
                opacity: 0.6, // Optional: Slight transparency
              }}
            />
          </Box>
          {/* Display Selected Files */}
          {Object.values(files).some((file) => file) && (
            <Box
              sx={{
                mt: 3,
                bgcolor: "#1E1E1E",
                p: 2,
                borderRadius: 1,
                maxHeight: "80px",
                overflowY: "auto",
              }}
            >
              <Typography
                variant="body1"
                sx={{
                  fontFamily: "MyCustomFont,SourceSerif4_18pt",
                  textTransform: "none",
                  mb: 1,
                }}
              >
                Selected Files:
              </Typography>
              {Object.entries(files).map(([key, file]) =>
                file ? (
                  <Box
                    key={key}
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      bgcolor: "#282828",
                      paddingLeft: 1,
                      paddingRight: 1,
                      mb: 1,
                      borderRadius: "5px",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: "12px",
                        fontWeight: "bold",
                        color: "#A5A5A5",
                        marginTop: 1,
                        textTransform: "uppercase",
                      }}
                    >
                      {key}
                    </Typography>

                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        width: "90%",
                      }}
                    >
                      <Typography sx={{ fontSize: "14px", color: "#fff" }}>
                        {file.name}
                      </Typography>
                      <IconButton
                        onClick={() =>
                          handleRemoveFile(key as keyof typeof files)
                        }
                      >
                        <CloseIcon sx={{ color: "white", fontSize: 18 }} />
                      </IconButton>
                    </Box>
                  </Box>
                ) : null
              )}
            </Box>
          )}

          <Grid container spacing={2} sx={{ marginTop: "4px" }}>
            <Grid item xs={6}>
              <Select
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                fullWidth
                variant="outlined"
                sx={{
                  bgcolor: "#282828",
                  borderRadius: "10px",
                  height: "38px",
                  color: "#fff",
                }}
              >
                {months.map((m) => (
                  <MenuItem
                    key={m}
                    value={m}
                    sx={{
                      color: "#fff",
                      bgcolor: "#282828",
                      fontFamily: "MyCustomFont,SourceSerif4_18pt",
                      textTransform: "none",

                      // Fix hover background color
                      "&:hover": {
                        backgroundColor: "#383838", // or #282828 if you want the same color
                      },

                      // Fix selected background color
                      "&.Mui-selected": {
                        backgroundColor: "#383838",
                      },
                      "&.Mui-selected:hover": {
                        backgroundColor: "#383838",
                      },
                    }}
                  >
                    {m}
                  </MenuItem>
                ))}
              </Select>
            </Grid>
            <Grid item xs={6}>
              <Select
                value={year}
                onChange={(e) => setYear(e.target.value)}
                fullWidth
                sx={{
                  bgcolor: "#282828",
                  borderRadius: "10px",
                  height: "38px",

                  color: "#fff",
                }}
              >
                {years.map((y) => (
                  <MenuItem
                    key={y}
                    value={y}
                    sx={{
                      color: "#fff",
                      bgcolor: "#282828",
                      fontFamily: "MyCustomFont,SourceSerif4_18pt",
                      textTransform: "none",

                      // Fix hover background color
                      "&:hover": {
                        backgroundColor: "#383838", // or #282828 if you want the same color
                      },

                      // Fix selected background color
                      "&.Mui-selected": {
                        backgroundColor: "#383838",
                      },
                      "&.Mui-selected:hover": {
                        backgroundColor: "#383838",
                      },
                    }}
                  >
                    {y}
                  </MenuItem>
                ))}
              </Select>
            </Grid>
          </Grid>
          {csvLoading ? (
            <Container
              style={{
                display: "flex",
                flexDirection: "row",
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
              sx={{
                mt: "32px",
                bgcolor: "#B72BF8",
                mb: "20px",
                borderRadius: "10px",
                height: "50px",
                paddingTop: "12px",
                paddingBottom: "12px",
                paddingRight: "16px",
                fontSize: "16PX",
                paddingLeft: "16px",
                fontFamily: "MyCustomFont,SourceSerif4_18pt",
                textTransform: "none",
              }}
              onClick={handleSubmit}
            >
              Upload
            </Button>
          )}
        </Box>
      </Modal>
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={5000}
        onClose={handleCloseSnackbar}
        message={snackbarMessage}
      />
    </>
  );
};
