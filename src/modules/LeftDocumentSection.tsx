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
  CircularProgress,
  InputAdornment
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import VerifiedIcon from "@mui/icons-material/Verified";
import CancelIcon from "@mui/icons-material/Cancel";
import PendingActionsIcon from "@mui/icons-material/PendingActions";
import DeleteIcon from "@mui/icons-material/Delete";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import { expenditureService } from "../services/expenditure.service";

interface DocumentRow {
  SNo: number;
  ReceiptNote: string | null;
  TaxInvoice: string | null;
  GSTInvoice: string | null;
  ModificationAdvice: string | null;
  InspectionCertificate: string | null;
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
  "Modification Advice",
  "Purchase Order",
  "Inspection Certificate",
  
];

type DocumentType = 'ReceiptNote' | 'TaxInvoice' | 'GSTInvoice' | 'ModificationAdvice' | 'PurchaseOrder' | 'InspectionCertificate';

export default function LeftDocumentSection() {
  const [rows, setRows] = useState<DocumentRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<{[key: string]: boolean}>({});
  const [verifyingRows, setVerifyingRows] = useState<{[key: number]: boolean}>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredRows, setFilteredRows] = useState<DocumentRow[]>([]);

  // Fetch data on component mount
  useEffect(() => {
    fetchExpenditureData();
  }, []);

  // Filter rows when search query or rows change
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredRows(rows);
    } else {
      const filtered = rows.filter(row => 
        row.AuthorizationCommittee && 
        row.AuthorizationCommittee.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredRows(filtered);
    }
  }, [searchQuery, rows]);

  const fetchExpenditureData = async () => {
    try {
      setLoading(true);
      const datafetched = await expenditureService.getExpenditureData();
      const data = datafetched.data;
      console.log("start:",data);

      // Process the data to ensure all document fields are properly handled
      const processedData = data.map((row: any) => ({
        ...row,
        SNo: row.SNo,
        AuthorizationCommittee: row.AuthorizationCommittee,
        VerificationTime: row.VerificationTime,
        Status:row.Status,
        Remark: row.Remark,
        ReceiptNote: row.ReceiptNote,
        TaxInvoice: row.TaxInvoice,
        GSTInvoice: row.GSTInvoice,
        ModificationAdvice: row.ModificationAdvice,
        PurchaseOrder: row.PurchaseOrder,
        InspectionCertificate: row.InspectionCertificate,
      }));
      console.log("Fetched data",processedData)
      setRows(processedData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const addNewRow = () => {
    const newRow: DocumentRow = {
      SNo: Date.now() % 2147483647,
      ReceiptNote: null,
      TaxInvoice: null,
      GSTInvoice: null,
      ModificationAdvice: null,
      PurchaseOrder: null,
      InspectionCertificate: null,
      Status: "pending" as const,
      VerificationTime: "",
      AuthorizationCommittee: "-",
      Remark: "",
    };
    setRows([newRow, ...rows]);
  };

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
        const combinedString = `${documentType}UploadTime`;
        const uploadTime = new Date();
        // Update UI immediately to show pending state
        const no=documentType === "GSTInvoice" ? base64String.IREPSRegNo : "-"
        if(documentType === "GSTInvoice")console.log("irepsno",base64String,no)
        console.log("uploadTime",uploadTime)
        // setRows(
        //   rows.map((row) =>
        //     row["SNo"] === rowId
        //       ? {
        //           ...row,
        //           [documentType]: base64String.response,
        //           [combinedString]: uploadTime.toISOString(),
        //           AuthorizationCommittee: documentType === "GSTInvoice" ? base64String.IREPSRegNo : "-",
        //         }
        //       : row
        //   )
        // );

        const updatedRow = {
          ...rows.find(row => row["SNo"] === rowId)!,
          [documentType]: base64String.response,
          [combinedString]: uploadTime.toISOString(),
          AuthorizationCommittee: documentType === "GSTInvoice" ? base64String.IREPSRegNo : "-",
        };

        // Update backend
        await expenditureService.updateExpenditureData(updatedRow);
        





        // Reload data from backend to ensure consistency
        // await fetchExpenditureData();
        const datafetched = await expenditureService.getExpenditureData();
        const data = datafetched.data;
        console.log("start:",data);

        // Process the data to ensure all document fields are properly handled
        const processedData = data.map((row: any) => ({
          ...row,
          SNo: row.SNo,
          AuthorizationCommittee: row.AuthorizationCommittee,
          VerificationTime: row.VerificationTime,
          Status:row.Status,
          Remark: row.Remark,
          ReceiptNote: row.ReceiptNote,
          TaxInvoice: row.TaxInvoice,
          GSTInvoice: row.GSTInvoice,
          ModificationAdvice: row.ModificationAdvice,
          PurchaseOrder: row.PurchaseOrder,
          InspectionCertificate: row.InspectionCertificate,
        }));
        console.log("Fetched data",processedData)
        setRows(processedData);

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

  // const deleteRow = async (rowId: number) => {
  //   try {
  //     // Remove from backend
  //     await expenditureService.updateExpenditureData({ id: rowId, deleted: true });
  //     // Update UI
  //     setRows(rows.filter(row => row["SNo"] !== rowId));
  //   } catch (error) {
  //     console.error('Error deleting row:', error);
  //   }
  // };

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

      console.log("Starting verification for row:", row);
      const response = await expenditureService.reportVerification(row);
      console.log("Verification response:", response);
      
      // Ensure we're handling the response properly
      let status: "approved" | "rejected" = "rejected";
      let formattedRemark = '';

      if (response) {
        // Check the status from the response object
        status = response.Status === "approved" || response.Status === "Approved" ? "approved" : "rejected";
        console.log("Determined status:", status, response.Status);
        console.log("Matched results",response.MatchedResults)
        console.log("Unmatched results",response.UnmatchedResults)
        
        // Format the remarks as bulleted points if Results array exists
        if (response.MatchedResults && Array.isArray(response.MatchedResults)) {
          formattedRemark = [
            'Unmatched Results',
            response.UnmatchedResults.map((result: string) => `• ${result}`).join('\n'),
            '',
            'Matched Results',
            response.MatchedResults.map((result: string) => `• ${result}`).join('\n'),
          ].join('\n')
          console.log("formatted remark",formattedRemark)
        } else if (response.Reason) {
          formattedRemark = response.Reason;
        }

        const updatedRow: DocumentRow = {
          ...row,
          Status: status,
          Remark: formattedRemark,
          VerificationTime: formatIndianDateTime(new Date()),
        };

        console.log("Preparing to update database with row:", {
          SNo: updatedRow.SNo,
          Status: updatedRow.Status,
          Reason: updatedRow.Remark
        });

        try {
          // First update the database
          const dbResponse = await expenditureService.updateExpenditureData(updatedRow);
          
          if (!dbResponse || !dbResponse.success) {
            throw new Error(dbResponse?.message || 'Database update failed');
          }
          
          console.log("Database update successful:", dbResponse);

          // Then update the UI
          setRows(rows.map(r => r.SNo === row.SNo ? updatedRow : r));
          
          // Finally reload data to ensure consistency
          // console.log("Reloading data from database...");
          // await fetchExpenditureData();
          
          console.log("Verification and database update completed successfully for row:", row.SNo);
        } catch (dbError) {
          console.error("Database update failed:", dbError);
          // Update UI with database error
          const dbErrorRow: DocumentRow = {
            ...row,
            Status: 'rejected' as const,
            Remark: `Database update failed: ${dbError instanceof Error ? dbError.message : 'Unknown error'}`,
            VerificationTime: formatIndianDateTime(new Date()),
          };
          
          // Update UI to show database error
          setRows(rows.map(r => r.SNo === row.SNo ? dbErrorRow : r));
          
          // Try to save the error state to database
          try {
            await expenditureService.updateExpenditureData(dbErrorRow);
            console.log("Error state saved to database");
          } catch (finalError) {
            console.error("Failed to save error state to database:", finalError);
          }
        }
      }
    } catch (error) {
      console.error("Error during verification:", error);
      
      const errorRow: DocumentRow = {
        ...row,
        Status: 'rejected' as const,
        Remark: `Verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        VerificationTime: formatIndianDateTime(new Date()),
      };
      
      // Update UI with verification error
      setRows(rows.map(r => r.SNo === row.SNo ? errorRow : r));
      
      // Try to save the error state to database
      try {
        await expenditureService.updateExpenditureData(errorRow);
        console.log("Error state saved to database");
      } catch (dbError) {
        console.error("Failed to save error state to database:", dbError);
      }
    } finally {
      // Clear loading state for this row verification
      setVerifyingRows(prev => ({
        ...prev,
        [row.SNo]: false
      }));
    }
  };

  const handleSearch = () => {
    // Search is handled by the useEffect above
    // This function can be used for additional search logic if needed
  };

  const handleClearSearch = () => {
    setSearchQuery("");
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
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2, mt: 2, alignItems: "center" }}>
        {/* Search Bar */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, flex: 1, maxWidth: "400px" }}>
          <TextField
            placeholder="Search by IREPS number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleSearch();
              }
            }}
            size="small"
            sx={{
              flex: 1,
              '& .MuiOutlinedInput-root': {
                color: 'white',
                backgroundColor: 'rgba(0, 0, 0, 0.1)',
                borderRadius: '8px',
                '& fieldset': {
                  borderColor: '#7B2FF7',
                },
                '&:hover fieldset': {
                  borderColor: '#7B2FF7',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#7B2FF7',
                },
                '& input::placeholder': {
                  color: 'rgba(255, 255, 255, 0.6)',
                  opacity: 1,
                },
              },
            }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  {searchQuery && (
                    <IconButton
                      onClick={handleClearSearch}
                      sx={{ color: 'rgba(255, 255, 255, 0.6)' }}
                      size="small"
                    >
                      <ClearIcon />
                    </IconButton>
                  )}
                </InputAdornment>
              ),
            }}
          />
          <Button
            variant="contained"
            onClick={handleSearch}
            sx={{
              background: "linear-gradient(90deg, #7B2FF7, #9F44D3)",
              color: "white",
              borderRadius: "8px",
              textTransform: "none",
              fontWeight: 600,
              minWidth: "auto",
              px: 2,
            }}
          >
            <SearchIcon />
          </Button>
        </Box>
        
        {/* <Button
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
        </Button> */}
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
        {filteredRows.length === 0 ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "100%",
              color: "rgba(255, 255, 255, 0.5)",
            }}
          >
            <Typography variant="h6">
              {searchQuery ? `No documents found for IREPS number: ${searchQuery}` : "No documents added yet"}
            </Typography>
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
                {/* Committee Header */}
                <Box sx={{
                  width: "150px",
                  textAlign: "center",
                  color: "white",
                  fontWeight: "bold",
                  flexShrink: 0
                }}>
                  IREPS No.
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
                {/* Action Header */}
                <Box sx={{
                  width: "90px",
                  textAlign: "center",
                  color: "white",
                  fontWeight: "bold",
                  flexShrink: 0
                }}>
                  Action
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
            {filteredRows.map((row, rowIndex) => (
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

                {/* Authorization Committee Column */}
                <Box sx={{ 
                  width: "150px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  color: "white"
                }}>
                  {row.AuthorizationCommittee}
                </Box>

                {/* File Upload Columns */}
                {Object.entries(row).filter(([key]) => 
                  ['ReceiptNote', 'TaxInvoice', 'GSTInvoice', 'ModificationAdvice', 'PurchaseOrder', 'InspectionCertificate'].includes(key)
                ).map(([key, file]) => {
                  const isNull = file === null;
                  const isUploading = uploadingFiles[`${row.SNo}-${key}`];
                  const uploadTimeKey = `${key}UploadTime`;
                  const uploadTime = (row as any)[uploadTimeKey] as string | undefined;
                  return (
                    <Box key={key} sx={{ width: "120px", flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
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
                      {/* Show upload time below the button if available */}
                      {uploadTime && (
                        <Typography variant="caption" sx={{ color: '#aaa', mt: 0.5, fontSize: '0.7rem', textAlign: 'center', wordBreak: 'break-all', width: '70px' }}>
                          {formatIndianDateTime(new Date(uploadTime))}
                        </Typography>
                      )}
                    </Box>
                  );
                })}

                {/* Verify Button */}
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

                {/* System Remark Column */}
                <Box sx={{ 
                  width: "350px",
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "flex-start",
                  flexShrink: 0,
                  color: "white",
                  fontStyle: row.Remark ? "normal" : "italic",
                  fontSize: "0.8rem",
                  paddingTop: "5px",
                  maxHeight: "120px",
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
                  margin: "0 8px",
                  whiteSpace: "pre-line"
                }}>
                  {row.Remark || "Pending review"}
                </Box>
              </Box>
            ))}
          </Box>
        )}
      </Paper>
    </Box>
  );
}
