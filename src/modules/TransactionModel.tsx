import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Container,
  Divider,
  Grid,
  IconButton,
  MenuItem,
  Modal,
  Select,
  Snackbar,
  Typography,
} from "@mui/material";
import UploadIcon from "@mui/icons-material/Upload";
import CloseIcon from "@mui/icons-material/Close";
import { Download, Upload } from "@mui/icons-material";
import { transactionService } from "../services/transaction.service";
import { parseExcelFile } from "../utils/otherUtils";
import { divisions, months, sectionsForComment } from "../utils/staticDataUtis";
import "react-quill/dist/quill.snow.css"; // Import styles
import CommentEditor from "./Comment";
import { commentService } from "../services/comment.service";

const years = Array.from({ length: 2026 - 2000 }, (_, i) => 2000 + i);

const fileKeys = ["Transaction"];
interface TransacitonModal {
  reloadGraph: boolean;
  setReloadGraph: any;
}
const TransactionModal = ({
  reloadGraph,
  setReloadGraph,
}: TransacitonModal) => {
  const [role, setRole] = useState("mainAdmin");
  const [open, setOpen] = useState(false);
  const [firstModalOpen, setFirstModalOpen] = useState(false);
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [division, setDivision] = useState("");
  const [csvLoading, setCsvLoading] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [files, setFiles] = useState<{ [key: string]: File | null }>({
    unlinked: null,
    basic: null,
    commutation: null,
  });
  const [data, setData] = useState<{ content: string; tableName: string }[]>(
    sectionsForComment.map((section) => ({ content: "", tableName: section }))
  );
  const handleOpen = () => setOpen(true);
  const handleRecoverableModalOpen = () => setFirstModalOpen(true);
  const handleClose = () => setOpen(false);
  const handleRecoverableModalClose = () => setFirstModalOpen(false);

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    key: string
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      setFiles((prev) => ({ ...prev, [key]: file }));
    }
  };
  useEffect(() => {
    let response = localStorage.getItem("role");
    if (response) {
      setRole(response);
    }
  });
  const handleRemoveFile = (key: string) => {
    setFiles((prev) => ({ ...prev, [key]: null }));
  };
  const handleSubmit = async () => {
    try {
      if (!files.Transaction || !month || !year || !division) {
        setSnackbarMessage("Please fill all fields and upload a file.");
        setSnackbarOpen(true);
        return;
      }

      setCsvLoading(true);

      const reader = new FileReader();
      reader.onload = async (e) => {
        const buffer = e.target?.result as ArrayBuffer;
        const { finalData, enrichedData } = await parseExcelFile(
          buffer,
          division,
          month,
          year,
          data
        );

        console.log("this is final data", finalData);

        const [uploadResponse, commentResponse] = await Promise.all([
          transactionService.uploadTransactionData(finalData),
          commentService.uploadCommentData(enrichedData),
        ]);

        if (uploadResponse.success && commentResponse.success) {
          setSnackbarMessage("Files uploaded and parsed successfully!");
          setSnackbarOpen(true);
          setFiles({ Transaction: null });
          setMonth("");
          setYear("");
          setDivision("");
          handleClose();
          setReloadGraph(!reloadGraph);
        } else {
          setSnackbarMessage(
            "Failed to upload files. Please check the data format."
          );
          setSnackbarOpen(true);
        }

        setCsvLoading(false);
      };

      reader.readAsArrayBuffer(files.Transaction);
    } catch (error: any) {
      setSnackbarOpen(true);
      setSnackbarMessage(`${error.message}`);
      setCsvLoading(false);
    }
  };
  const handleCloseSnackbar = () => setSnackbarOpen(false);

  return (
    <>
      {/* Button to trigger modal */}
      <Button
        variant="contained"
        onClick={handleOpen}
        startIcon={<Upload />}
        sx={{
          backgroundColor: "#222633",
          color: "white",
          "&:hover": { backgroundColor: "#222633" },
          border: "1.5px solid rgba(255, 255, 255, 0.1)", // Soft, subtle border
          borderRadius: "12px",
          p: "12px",
          fontSize: "16px",
          fontFamily: "MyCustomFont,SourceSerif4_18pt",
          textTransform: "none",
          marginX: 1,
        }}
      >
        Upload Data
      </Button>

      {/* Upload Modal */}
      <Modal open={open} onClose={handleClose}>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            bgcolor: "#1E1E1E",
            borderRadius: "12px",
            padding: "24px",
            width: "95%",
            maxWidth: "700px",
            maxHeight: "70vh",
            overflowY: "auto",
          }}
        >
          {/* Arpan Data Section */}
          <Typography
            variant="body1"
            sx={{
              fontFamily: "MyCustomFont,SourceSerif4_18pt",
              textTransform: "none",
              color: "#fff",
            }}
          >
            Transaction Data
          </Typography>
          <Divider
            sx={{
              height: "1px",
              backgroundColor: "#FFFFFF",
              width: "3%",
              marginTop: "4px",
              opacity: 0.6,
            }}
          />

          {/* File Uploads */}
          <Grid container spacing={2} sx={{ marginTop: "12px" }}>
            {fileKeys.map((key) => (
              <Grid item xs={4} key={key}>
                <input
                  type="file"
                  accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                  id={`upload-${key}`}
                  style={{ display: "none" }}
                  onChange={(e) => handleFileChange(e, key)}
                />

                <label htmlFor={`upload-${key}`}>
                  <Button
                    component="span"
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

          {/* Display Selected Files */}
          {Object.values(files).some((file) => file) && (
            <Box
              sx={{
                mt: 3,
                bgcolor: "#1E1E1E",
                p: 2,
                borderRadius: 1,
                maxHeight: "100px",
                overflowY: "auto",
              }}
            >
              <Typography
                variant="body1"
                sx={{
                  fontFamily: "MyCustomFont,SourceSerif4_18pt",
                  textTransform: "none",
                  mb: 1,
                  color: "#fff",
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
                      padding: 1,
                      mb: 1,
                      borderRadius: "5px",
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: "12px",
                        fontWeight: "bold",
                        color: "#A5A5A5",
                        textTransform: "uppercase",
                      }}
                    >
                      {key}
                    </Typography>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <Typography sx={{ fontSize: "14px", color: "#fff" }}>
                        {file.name}
                      </Typography>
                      <IconButton onClick={() => handleRemoveFile(key)}>
                        <CloseIcon sx={{ color: "white", fontSize: 18 }} />
                      </IconButton>
                    </Box>
                  </Box>
                ) : null
              )}
            </Box>
          )}

          {/* Month / Year / Division Selectors */}
          <Box sx={{ mt: 3 }}>
            <Typography
              variant="body1"
              sx={{
                fontFamily: "MyCustomFont,SourceSerif4_18pt",
                textTransform: "none",
                color: "#fff",
              }}
            >
              Data Month
            </Typography>
            <Divider
              sx={{
                height: "1px",
                backgroundColor: "#FFFFFF",
                width: "3%",
                marginTop: "4px",
                opacity: 0.6,
              }}
            />
          </Box>

          <Grid container spacing={2} sx={{ marginTop: "12px" }}>
            <Grid item xs={4}>
              <Select
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                fullWidth
                displayEmpty
                sx={{
                  bgcolor: "#282828",
                  borderRadius: "10px",
                  height: "38px",
                  color: "#fff",
                }}
                MenuProps={{
                  PaperProps: {
                    sx: {
                      bgcolor: "#282828",
                      color: "#fff",
                    },
                  },
                }}
              >
                <MenuItem value="" disabled>
                  Month
                </MenuItem>
                {months.map((m) => (
                  <MenuItem
                    key={m}
                    value={m}
                    sx={{
                      color: "#fff",
                      bgcolor: "#282828",
                      fontFamily: "MyCustomFont,SourceSerif4_18pt",
                      textTransform: "none",
                      "&:hover": { backgroundColor: "#383838" },
                      "&.Mui-selected": { backgroundColor: "#383838" },
                      "&.Mui-selected:hover": { backgroundColor: "#383838" },
                    }}
                  >
                    {m}
                  </MenuItem>
                ))}
              </Select>
            </Grid>
            <Grid item xs={4}>
              <Select
                value={year}
                onChange={(e) => setYear(e.target.value)}
                fullWidth
                displayEmpty
                sx={{
                  bgcolor: "#282828",
                  borderRadius: "10px",
                  height: "38px",
                  color: "#fff",
                }}
                MenuProps={{
                  PaperProps: {
                    sx: {
                      bgcolor: "#282828",
                      color: "#fff",
                    },
                  },
                }}
              >
                <MenuItem value="" disabled>
                  Year
                </MenuItem>
                {years.map((y) => (
                  <MenuItem
                    key={y}
                    value={y}
                    sx={{
                      color: "#fff",
                      bgcolor: "#282828",
                      fontFamily: "MyCustomFont,SourceSerif4_18pt",
                      textTransform: "none",
                      "&:hover": { backgroundColor: "#383838" },
                      "&.Mui-selected": { backgroundColor: "#383838" },
                      "&.Mui-selected:hover": { backgroundColor: "#383838" },
                    }}
                  >
                    {y}
                  </MenuItem>
                ))}
              </Select>
            </Grid>
            <Grid item xs={4}>
              <Select
                value={division}
                onChange={(e) => setDivision(e.target.value)}
                fullWidth
                displayEmpty
                sx={{
                  bgcolor: "#282828",
                  borderRadius: "10px",
                  height: "38px",
                  color: "#fff",
                }}
                MenuProps={{
                  PaperProps: {
                    sx: {
                      bgcolor: "#282828",
                      color: "#fff",
                    },
                  },
                }}
              >
                <MenuItem value="" disabled>
                  Division
                </MenuItem>
                {(role === "mainAdmin"
                  ? divisions
                  : divisions.filter((d) => d.name === role)
                ).map((d) => (
                  <MenuItem
                    key={d.name}
                    value={d.name}
                    sx={{
                      color: "#fff",
                      bgcolor: "#282828",
                      fontFamily: "MyCustomFont,SourceSerif4_18pt",
                      textTransform: "none",
                      "&:hover": { backgroundColor: "#383838" },
                      "&.Mui-selected": { backgroundColor: "#383838" },
                      "&.Mui-selected:hover": { backgroundColor: "#383838" },
                    }}
                  >
                    {d.name}
                  </MenuItem>
                ))}
              </Select>
            </Grid>
            <CommentEditor data={data} setData={setData} />
          </Grid>

          {/* Submit Button or Loader */}
          {csvLoading ? (
            <Container
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                mt: 5,
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
                fontSize: "16px",
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
      {/* Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={5000}
        onClose={handleCloseSnackbar}
        message={snackbarMessage}
      />
    </>
  );
};

export default TransactionModal;
