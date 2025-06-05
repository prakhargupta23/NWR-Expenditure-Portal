import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Paper,
  TextField,
  Typography,
  Tooltip,
  Avatar,
  Badge,
  IconButton,
  CircularProgress
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import VerifiedIcon from "@mui/icons-material/Verified";
import CancelIcon from "@mui/icons-material/Cancel";
import PendingActionsIcon from "@mui/icons-material/PendingActions";
import DeleteIcon from "@mui/icons-material/Delete";
import { expenditureService } from "../services/expenditure.service";

interface DocumentRow {
  SNo: number;
  ReceiptNote: string | null;
  TaxInvoice: string | null;
  GSTInvoice: string | null;
  ModificationAdvice: string | null;
  // InspectionCertificate: string | null;
  PurchaseOrder: string | null;
  Status: "pending" | "approved" | "rejected";
  VerificationTime: string;
  AuthorizationCommittee: string;
  Remark: string;
}

const documentTypes = [
  "SNo",
  "Receipt Note",
  "Tax Invoice",
  "GST Invoice",
  "Modification advice",
  "Purchase Order"
];

type DocumentType = 'ReceiptNote' | 'TaxInvoice' | 'GSTInvoice' | 'ModificationAdvice' | 'PurchaseOrder';

export default function LeftDocumentSection() {
  const [rows, setRows] = useState<DocumentRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<{[key: string]: boolean}>({});
  const [verifyingRows, setVerifyingRows] = useState<{[key: number]: boolean}>({});

  // Fetch data on component mount
  useEffect(() => {
    fetchExpenditureData();
  }, []);

  const fetchExpenditureData = async () => {
    try {
      setLoading(true);
      const datafetched = await expenditureService.getExpenditureData();
      const data = datafetched.data;
      console.log("start:",data);

      // Process the data to ensure all document fields are properly handled
      const processedData = data.map((row: any) => ({
        ...row,
        // Ensure all document fields are either base64 strings or null
        SNo: row.SNo,
        AuthorizationCommittee: row.AuthorizationCommittee,
        VerificationTime: row.VerificationTime,
        Status:row.Status,
        Remark: row.Remark,
        ReceiptNote: row.ReceiptNote,
        // InspectionCertificate: row.InspectionCertificate,
        TaxInvoice: row.TaxInvoice,
        GSTInvoice: row.GSTInvoice,
        ModificationAdvice: row.ModificationAdvice,
        PurchaseOrder: row.PurchaseOrder,
      }));
      console.log("do wit data",processedData)
      setRows(processedData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const addNewRow = () => {
    const newRow: DocumentRow = {
      SNo: Date.now(),
      ReceiptNote: null,
      TaxInvoice: null,
      GSTInvoice: null,
      ModificationAdvice: null,
      // InspectionCertificate: null,
      PurchaseOrder: null,
      Status: "pending" as const,
      VerificationTime: "",
      AuthorizationCommittee: "",
      Remark: "",
    };
    setRows([...rows, newRow]);
  };

  // Function to save a row to the backend (insert or update)
  // const saveRowToBackend = async (row: DocumentRow) => {
  //   try {
  //     // Assuming updateExpenditureData handles both insert (no id) and update (with id)
  //     const result = await expenditureService.updateExpenditureData(row);
  //     console.log("Save row result:", result);
  //     // If it was an insert, the result might contain the new ID from the database
  //     const resultData = result as any; // Cast to any to bypass linter error
  //     if (typeof resultData === 'object' && resultData !== null && resultData.success && resultData["SNo"] && !row["SNo"]) {
  //       // Update the local state with the new ID if it was an insert
  //       setRows(prevRows => prevRows.map(prevRow => 
  //         // Find the temporary row by matching other properties if ID is not available yet, 
  //         // or if a temporary ID was used, match and replace with the returned ID
  //         // A more robust approach might involve a temporary ID or matching by unique properties
  //         // For simplicity here, we'll rely on the backend returning the full updated row or new row with ID
  //         prevRow["SNo"] === row["SNo"] ? { ...prevRow, id: resultData["SNo"] } : prevRow
  //       ));
  //     } else if (typeof resultData === 'object' && resultData !== null && resultData.success && row["SNo"]) {
  //       // Update successful for existing row, no need to update ID
  //       console.log(`Row with ID ${row["SNo"]} updated successfully.`);
  //     }
  //     return result;
  //   } catch (error) {
  //     console.error("Error saving row to backend:", error);
  //     throw error;
  //   }
  // };

  const handleFileUpload = async (
    rowId: number,
    documentType: DocumentType,
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0] || null;
    if (file) {
      try {
        // Set loading state for this specific file upload
        setUploadingFiles(prev => ({
          ...prev,
          [`${rowId}-${documentType}`]: true
        }));

        const base64String = await expenditureService.getdata(file, documentType, rowId);
        
        // Update UI immediately to show pending state
        setRows(
          rows.map((row) =>
            row["SNo"] === rowId
              ? {
                  ...row,
                  [documentType]: base64String,
                  verification: "pending" as const,
                  verificationTime: "",
                  authorizationCommittee: "",
                  remark: "Processing document...",
                }
              : row
          )
        );

        const updatedRow = {
          ...rows.find(row => row["SNo"] === rowId)!,
          [documentType]: base64String,
        };

        // Update backend
        await expenditureService.updateExpenditureData(updatedRow);
        
        // Reload data from backend to ensure consistency
        await fetchExpenditureData();

      } catch (error) {
        console.error('Error processing document:', error);
        setRows(
          rows.map((row) =>
            row["SNo"] === rowId
              ? {
                  ...row,
                  verification: "rejected" as const,
                  remark: "Error processing document",
                }
              : row
          )
        );
      } finally {
        // Clear loading state for this file upload
        setUploadingFiles(prev => ({
          ...prev,
          [`${rowId}-${documentType}`]: false
        }));
      }
    }
    event.target.value = "";
  };

  const deleteRow = async (rowId: number) => {
    try {
      // Remove from backend
      await expenditureService.updateExpenditureData({ id: rowId, deleted: true });
      // Update UI
      setRows(rows.filter(row => row["SNo"] !== rowId));
    } catch (error) {
      console.error('Error deleting row:', error);
    }
  };

  const getVerificationIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <VerifiedIcon color="success" fontSize="small" />;
      case "rejected":
        return <CancelIcon color="error" fontSize="small" />;
      default:
        return <PendingActionsIcon color="warning" fontSize="small" />;
    }
  };

  const formatIndianDateTime = (date: Date): string => {
    return date.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  const handleVerify = async (row: DocumentRow) => {
    try {
      // Set loading state for this row verification
      setVerifyingRows(prev => ({
        ...prev,
        [row.SNo]: true
      }));

      const response = await expenditureService.reportVerification(row);
      console.log("verification response leftsectiondocument", response);
      
      // Ensure we're handling the response properly
      let status: "approved" | "rejected" = "rejected";
      let reason = '';

      if (typeof response === 'object' && response !== null) {
        if ('status' in response) {
          status = response.status === 'passed' ? 'approved' : 'rejected';
        }
        if ('reason' in response) {
          reason = typeof response.reason === 'string' ? response.reason : JSON.stringify(response.reason);
        } else if ('issues' in response) {
          reason = Array.isArray(response.issues) 
            ? response.issues.join(', ') 
            : JSON.stringify(response.issues);
        }
      } else if (typeof response === 'string') {
        try {
          const parsedResponse = JSON.parse(response);
          status = parsedResponse.status === 'passed' ? 'approved' : 'rejected';
          reason = parsedResponse.reason || '';
        } catch {
          reason = response;
        }
      }

      const updatedRow: DocumentRow = {
        ...row,
        Status: status,
        Remark: reason,
        VerificationTime: formatIndianDateTime(new Date())
      };

      // Update the row in the UI
      setRows(rows.map(r => r.SNo === row.SNo ? updatedRow : r));
      
      // Update the backend with the verification results
      await expenditureService.updateExpenditureData(updatedRow);
      
      // Reload data from backend to ensure consistency
      await fetchExpenditureData();
      
      // Optionally show a success message
      console.log("Verification completed:", updatedRow);
    } catch (error) {
      console.error("Error verifying row:", error);
      // Update row with error status
      const errorRow: DocumentRow = {
        ...row,
        Status: 'rejected' as const,
        Remark: error instanceof Error ? error.message : 'Verification failed',
        VerificationTime: formatIndianDateTime(new Date())
      };
      
      // Update UI with error state
      setRows(rows.map(r => r.SNo === row.SNo ? errorRow : r));
      
      // Update backend with error state
      await expenditureService.updateExpenditureData(errorRow);
      
      // Reload data from backend
      await fetchExpenditureData();
    } finally {
      // Clear loading state for this row verification
      setVerifyingRows(prev => ({
        ...prev,
        [row.SNo]: false
      }));
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1, mt: 4 }}>
        <Typography variant="h6" sx={{ color: "white", fontWeight: 600 }}>
          Documents
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={addNewRow}
          sx={{
            background: "linear-gradient(90deg, #7B2FF7, #9F44D3)",
            color: "white",
            borderRadius: "8px",
            textTransform: "none",
            fontWeight: 600,
          }}
        >
          Add New
        </Button>
      </Box>

      <Paper
        elevation={3}
        sx={{
          flex: 1,
          borderRadius: "12px",
          backgroundColor: "#161921",
          border: "1px solid rgba(251, 249, 252, 0.2)",
          overflow: "auto",
          "&::-webkit-scrollbar": {
            height: "6px",
          },
          "&::-webkit-scrollbar-track": {
            background: "#161921",
          },
          "&::-webkit-scrollbar-thumb": {
            background: "#7B2FF7",
            borderRadius: "3px",
          },
        }}
      >
        {rows.length === 0 ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "100%",
              color: "rgba(255, 255, 255, 0.5)",
            }}
          >
            <Typography variant="h6">No documents added yet</Typography>
          </Box>
        ) : (
          <Box sx={{ p: 2, width: "max-content", minWidth: "100%" }}>
            <Box sx={{ 
              display: "flex", 
              gap: 1,
              width: "max-content",
              minWidth: "100%",
              pb: 2
            }}>
              {/* Header Row */}
              <Box sx={{
                display: "flex",
                gap: 1,
                position: "sticky",
                left: 0,
                zIndex: 1,
                mb: 2,
                width: "max-content",
                minWidth: "100%"
              }}>
                {/* S.No Header */}
                <Box sx={{
                  width: "120px",
                  textAlign: "center",
                  color: "white",
                  fontWeight: "bold",
                  flexShrink: 0
                }}>
                  S.No
                </Box>
                {/* Status Header */}
                <Box sx={{
                  width: "100px",
                  textAlign: "center",
                  color: "white",
                  fontWeight: "bold",
                  flexShrink: 0
                }}>
                  Status
                </Box>
                {/* Verified At Header */}
                <Box sx={{
                  width: "150px",
                  textAlign: "center",
                  color: "white",
                  fontWeight: "bold",
                  flexShrink: 0
                }}>
                  Verified At
                </Box>
                {/* Committee Header */}
                <Box sx={{
                  width: "150px",
                  textAlign: "center",
                  color: "white",
                  fontWeight: "bold",
                  flexShrink: 0
                }}>
                  Committee
                </Box>
                {/* Document Type Headers (excluding S.No) */}
                {documentTypes.slice(1).map((type, index) => (
                   <Box key={index} sx={{ 
                     width: "120px",
                     textAlign: "center",
                     color: "white",
                     fontWeight: "bold",
                     flexShrink: 0
                   }}>
                     {type}
                   </Box>
                 ))}
                 {/* Remarks Header */}
                <Box sx={{
                  width: "350px",
                  textAlign: "center",
                  color: "white",
                  fontWeight: "bold",
                  flexShrink: 0
                }}>
                  Remark
                </Box>
              </Box>
            </Box>

            {/* Data Rows */}
            {rows.map((row, rowIndex) => (
              <Box 
                key={row["SNo"]}
                sx={{
                  display: "flex",
                  gap: 1,
                  mb: 2,
                  backgroundColor: "#1E2130",
                  borderRadius: "8px",
                  p: 2,
                  position: "relative",
                  width: "max-content",
                  minWidth: "100%"
                }}
              >
                {/* S.No Column */}
                <Box sx={{ 
                  width: "120px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  color: "white"
                }}>
                  {row["SNo"]}
                </Box>

                {/* Verification Status Column */}
                <Box sx={{ 
                  width: "100px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0
                }}>
                  <Tooltip title={row.Status} arrow>
                    <Badge
                      overlap="circular"
                      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                      badgeContent={getVerificationIcon(row.Status)}
                    >
                      <Avatar sx={{ 
                        bgcolor: row.Status === "approved" 
                          ? "success.main" 
                          : row.Status === "rejected" 
                            ? "error.main" 
                            : "warning.main",
                        width: 24,
                        height: 24
                      }}>
                        {row.Status.charAt(0).toUpperCase()}
                      </Avatar>
                    </Badge>
                  </Tooltip>
                </Box>

                {/* Verification Time Column */}
                <Box sx={{ 
                  width: "150px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  color: "white"
                }}>
                  {row.VerificationTime || "-"}
                </Box>

                {/* Authorization Committee Column */}
                <Box sx={{ 
                  width: "150px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  color: "white"
                }}>
                  {row.AuthorizationCommittee || "-"}
                </Box>

                {/* File Upload Columns */}
                {Object.entries(row).filter(([key]) => 
                  ['ReceiptNote', 'TaxInvoice', 'GSTInvoice', 'PurchaseOrder', 'ModificationAdvice'].includes(key)
                ).map(([key, file]) => {
                  const isNull = file === null;
                  const isUploading = uploadingFiles[`${row.SNo}-${key}`];
                  
                  return (
                    <Box key={key} sx={{ width: "120px", flexShrink: 0 }}>
                      <input
                        accept="*"
                        style={{ display: "none" }}
                        id={`file-upload-${row["SNo"]}-${key}`}
                        type="file"
                        onChange={(e) => handleFileUpload(row["SNo"], key as DocumentType, e)}
                        disabled={!isNull || isUploading}
                      />
                      <label htmlFor={`file-upload-${row["SNo"]}-${key}`}>
                        <Tooltip title={!isNull ? "File already uploaded" : key.replace(/([A-Z])/g, ' $1').trim()} arrow>
                          <Button
                            variant="outlined"
                            component="span"
                            sx={{
                              minWidth: '60px',
                              width: '60px',
                              height: '40px',
                              padding: '8px',
                              color: !isNull ? "#4CAF50" : "inherit",
                              borderColor: !isNull ? "#4CAF50" : "rgba(255, 255, 255, 0.3)",
                              opacity: !isNull ? 0.7 : 1,
                              '&.Mui-disabled': {
                                color: '#4CAF50',
                                borderColor: '#4CAF50',
                              },
                              '& .MuiButton-startIcon': {
                                margin: 0
                              }
                            }}
                            disabled={!isNull || isUploading}
                          >
                            {isUploading ? (
                              <CircularProgress size={20} color="inherit" />
                            ) : (
                              <CloudUploadIcon />
                            )}
                          </Button>
                        </Tooltip>
                      </label>
                    </Box>
                  );
                })}

                {/* System Remark Column */}
                <Box sx={{ 
                  width: "350px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  color: "white",
                  fontStyle: row.Remark ? "normal" : "italic",
                  fontSize: "0.6rem",
                  paddingTop: "5px",
                  maxHeight: "80px",
                  overflow: "auto",
                  "&::-webkit-scrollbar": {
                    width: "6px",
                  },
                  "&::-webkit-scrollbar-track": {
                    background: "#1E2130",
                    borderRadius: "3px",
                  },
                  "&::-webkit-scrollbar-thumb": {
                    background: "#7B2FF7",
                    borderRadius: "3px",
                  },
                  padding: "8px 16px",
                  wordBreak: "break-word",
                  backgroundColor: "rgba(0, 0, 0, 0.2)",
                  borderRadius: "4px",
                  margin: "0 8px"
                }}>
                  {row.Remark || "Pending review"}
                </Box>
                <Box sx={{ width: 24 }} /> {/* Space after remark */}
                <Button
                  variant="contained"
                  color="success"
                  startIcon={verifyingRows[row.SNo] ? <CircularProgress size={20} color="inherit" /> : <VerifiedIcon />}
                  sx={{
                    borderRadius: "8px",
                    textTransform: "none",
                    fontWeight: 600,
                    minWidth: "90px"
                  }}
                  onClick={() => handleVerify(row)}
                  disabled={row.Status !== "pending" || verifyingRows[row.SNo]}
                >
                  {verifyingRows[row.SNo] ? "Verifying..." : "Verify"}
                </Button>
              </Box>
            ))}
          </Box>
        )}
      </Paper>
    </Box>
  );
}