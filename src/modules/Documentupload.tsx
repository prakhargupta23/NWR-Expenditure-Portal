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
  InputAdornment,
  Grid,
  Card,
  CardContent,
  Divider,
  Chip
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import VerifiedIcon from "@mui/icons-material/Verified";
import CancelIcon from "@mui/icons-material/Cancel";
import PendingActionsIcon from "@mui/icons-material/PendingActions";
import DeleteIcon from "@mui/icons-material/Delete";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import ScheduleIcon from "@mui/icons-material/Schedule";
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
  { key: "ReceiptNote", label: "Receipt Note", icon: "📄" },
  { key: "TaxInvoice", label: "Tax Invoice", icon: "🧾" },
  { key: "GSTInvoice", label: "GST Invoice", icon: "📋" },
  { key: "ModificationAdvice", label: "Modification Advice", icon: "✏️" },
  { key: "PurchaseOrder", label: "Purchase Order", icon: "📝" },
  { key: "InspectionCertificate", label: "Inspection Certificate", icon: "🔍" },
];

type DocumentType = 'ReceiptNote' | 'TaxInvoice' | 'GSTInvoice' | 'ModificationAdvice' | 'PurchaseOrder' | 'InspectionCertificate';

export default function DocumentUpload() {
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
      // Show only the most recent row (first item in the array)
      setFilteredRows(rows.length > 0 ? [rows[0]] : []);
    } else {
      const filtered = rows.filter(row => 
        row.AuthorizationCommittee && 
        row.AuthorizationCommittee.toLowerCase().includes(searchQuery.toLowerCase())
      );
      // Even with search, show only the most recent matching row
      setFilteredRows(filtered.length > 0 ? [filtered[0]] : []);
    }
  }, [searchQuery, rows]);

  const fetchExpenditureData = async () => {
    try {
      setLoading(true);
      const datafetched = await expenditureService.getExpenditureData();
      const data = datafetched.data;
      console.log("start:", data);

      // Process the data to ensure all document fields are properly handled
      const processedData = data.map((row: any) => ({
        ...row,
        SNo: row.SNo,
        AuthorizationCommittee: row.AuthorizationCommittee,
        VerificationTime: row.VerificationTime,
        Status: row.Status,
        Remark: row.Remark,
        ReceiptNote: row.ReceiptNote,
        TaxInvoice: row.TaxInvoice,
        GSTInvoice: row.GSTInvoice,
        ModificationAdvice: row.ModificationAdvice,
        PurchaseOrder: row.PurchaseOrder,
        InspectionCertificate: row.InspectionCertificate,
      }));
      console.log("Fetched data", processedData);
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
        
        const updatedRow = {
          ...rows.find(row => row["SNo"] === rowId)!,
          [documentType]: base64String.response,
          [combinedString]: uploadTime.toISOString(),
          AuthorizationCommittee: documentType === "GSTInvoice" ? base64String.IREPSRegNo : "-",
        };

        // Update backend
        await expenditureService.updateExpenditureData(updatedRow);

        // Reload data from backend to ensure consistency
        const datafetched = await expenditureService.getExpenditureData();
        const data = datafetched.data;

        const processedData = data.map((row: any) => ({
          ...row,
          SNo: row.SNo,
          AuthorizationCommittee: row.AuthorizationCommittee,
          VerificationTime: row.VerificationTime,
          Status: row.Status,
          Remark: row.Remark,
          ReceiptNote: row.ReceiptNote,
          TaxInvoice: row.TaxInvoice,
          GSTInvoice: row.GSTInvoice,
          ModificationAdvice: row.ModificationAdvice,
          PurchaseOrder: row.PurchaseOrder,
          InspectionCertificate: row.InspectionCertificate,
        }));
        setRows(processedData);

      } catch (error) {
        console.error('Error processing document:', error);
      } finally {
        setUploadingFiles(prev => ({
          ...prev,
          [`${rowId}-${documentType}`]: false
        }));
      }
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
      second: '2-digit'
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
    // Search functionality is handled by useEffect
  };

  const handleClearSearch = () => {
    setSearchQuery("");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "success";
      case "rejected":
        return "error";
      default:
        return "warning";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "approved":
        return "Approved";
      case "rejected":
        return "Rejected";
      default:
        return "Pending";
    }
  };

  return (
    <Box
      sx={{
        height: "100%",
        backgroundColor: "#0A0D14",
        color: "white",
        p: 3,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden"
      }}
    >
      {/* Header Section */}
      <Box sx={{ mb: 0.5 }}>
        <Box sx={{ display: "flex", justifyContent: "flex-end", alignItems: "center", mb: 0.5 }}>
          <Button
            variant="contained"
            size="small"
            startIcon={<AddIcon />}
            onClick={addNewRow}
            sx={{
              background: "linear-gradient(90deg, #7B2FF7, #9F44D3)",
              color: "white",
              borderRadius: "6px",
              textTransform: "none",
              fontWeight: 600,
              fontSize: "0.8rem",
              px: 2,
              py: 0.5
            }}
          >
            Add New Document
          </Button>
        </Box>
      </Box>

      {/* Content Section */}
      <Box sx={{ flex: 1, overflow: "hidden" }}>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
            <CircularProgress sx={{ color: "#7B2FF7" }} />
          </Box>
        ) : filteredRows.length === 0 ? (
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
          <Box sx={{ height: "100%", p: 2 }}>
            {filteredRows.map((row) => (
              <Card
                key={row.SNo}
                sx={{
                  backgroundColor: "#1E2130",
                  border: "1px solid rgba(251, 249, 252, 0.2)",
                  borderRadius: "12px",
                  height: "100%",
                  transition: "transform 0.2s ease-in-out",
                  "&:hover": {
                    transform: "translateY(-2px)",
                    boxShadow: "0 8px 25px rgba(123, 47, 247, 0.3)",
                  },
                }}
              >
                <CardContent sx={{ p: 3, height: "100%", display: "flex", flexDirection: "column" }}>
                  {/* Top Section - SNo, Status, and IREPS */}
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
                    {/* SNo - Top Left */}
                    <Box>
                      <Typography variant="body2" sx={{ color: "rgba(255, 255, 255, 0.7)", mb: 0.5, fontSize: "0.8rem" }}>
                        S.No
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: "bold", color: "#7B2FF7", fontSize: "1.2rem" }}>
                        {row.SNo}
                      </Typography>
                    </Box>

                    {/* Status - Center */}
                    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                      <Typography variant="body2" sx={{ color: "rgba(255, 255, 255, 0.7)", mb: 0.5, fontSize: "0.8rem" }}>
                        Status
                      </Typography>
                      <Chip
                        label={getStatusText(row.Status)}
                        color={getStatusColor(row.Status) as any}
                        size="small"
                        icon={getVerificationIcon(row.Status)}
                        sx={{ fontWeight: 600, fontSize: "0.8rem", p: 0.5 }}
                      />
                      {/* {row.Status === "pending" && (
                        <Button
                          variant="contained"
                          color="success"
                          size="small"
                          startIcon={verifyingRows[row.SNo] ? <CircularProgress size={16} color="inherit" /> : <VerifiedIcon />}
                          sx={{
                            mt: 1,
                            borderRadius: "6px",
                            textTransform: "none",
                            fontWeight: 600,
                            fontSize: "0.8rem",
                            px: 2,
                            py: 0.5
                          }}
                          onClick={() => handleVerify(row)}
                          disabled={verifyingRows[row.SNo]}
                        >
                          {verifyingRows[row.SNo] ? "Verifying..." : "Verify Documents"}
                        </Button>
                      )} */}
                    </Box>

                    {/* IREPS Number - Top Right */}
                    <Box sx={{ textAlign: "right" }}>
                      <Typography variant="body2" sx={{ color: "rgba(255, 255, 255, 0.7)", mb: 0.5, fontSize: "0.8rem" }}>
                        IREPS Bill No.
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: "bold", color: "white", fontSize: "1.2rem" }}>
                        {row.AuthorizationCommittee}
                      </Typography>
                    </Box>
                  </Box>

                  <Divider sx={{ mb: 3, borderColor: "rgba(255, 255, 255, 0.1)" }} />

                  {/* Center Section - Document Upload Buttons */}
                  <Box sx={{ flex: 1, mb: 3 }}>
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: "white", textAlign: "center", fontSize: "1.1rem" }}>
                      Document Uploads
                    </Typography>
                    
                    <Box sx={{ display: "flex", justifyContent: "center", gap: 1.5, flexWrap: "wrap" }}>
                      {documentTypes.map((docType) => {
                        const file = row[docType.key as keyof DocumentRow] as string | null;
                        const isNull = file === null;
                        const isUploading = uploadingFiles[`${row.SNo}-${docType.key}`];
                        const uploadTimeKey = `${docType.key}UploadTime`;
                        const uploadTime = (row as any)[uploadTimeKey] as string | undefined;

                        return (
                          <Box key={docType.key} sx={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: "100px" }}>
                            <input
                              accept="*"
                              style={{ display: "none" }}
                              id={`file-upload-${row.SNo}-${docType.key}`}
                              type="file"
                              onChange={(e) => handleFileUpload(row.SNo, docType.key as DocumentType, e)}
                              disabled={!isNull || isUploading}
                            />
                            <label htmlFor={`file-upload-${row.SNo}-${docType.key}`}>
                              <Tooltip title={!isNull ? "File already uploaded" : `Upload ${docType.label}`} arrow>
                                <Button
                                  variant="outlined"
                                  component="span"
                                  sx={{
                                    width: '100px',
                                    height: '80px',
                                    color: !isNull ? "#4CAF50" : "inherit",
                                    borderColor: !isNull ? "#4CAF50" : "rgba(255, 255, 255, 0.3)",
                                    opacity: !isNull ? 0.7 : 1,
                                    '&.Mui-disabled': {
                                      color: '#4CAF50',
                                      borderColor: '#4CAF50',
                                    },
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 0.5
                                  }}
                                  disabled={!isNull || isUploading}
                                >
                                  {isUploading ? (
                                    <CircularProgress size={20} color="inherit" />
                                  ) : (
                                    <>
                                      <Typography variant="h6" sx={{ fontSize: '1.5rem' }}>
                                        {docType.icon}
                                      </Typography>
                                      <Typography variant="caption" sx={{ fontSize: '0.7rem', textAlign: 'center', fontWeight: 500 }}>
                                        {docType.label}
                                      </Typography>
                                    </>
                                  )}
                                </Button>
                              </Tooltip>
                            </label>
                            {/* Show upload time below the button if available */}
                            {uploadTime && (
                              <Typography variant="caption" sx={{ color: '#aaa', mt: 0.5, fontSize: '0.6rem', textAlign: 'center' }}>
                                {formatIndianDateTime(new Date(uploadTime))}
                              </Typography>
                            )}
                          </Box>
                        );
                      })}
                    </Box>

                    {/* Verify Button Below Upload Buttons */}
                    <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
                      <Button
                        variant="contained"
                        color="success"
                        size="large"
                        startIcon={verifyingRows[row.SNo] ? <CircularProgress size={20} color="inherit" /> : <VerifiedIcon />}
                        sx={{
                          borderRadius: "8px",
                          textTransform: "none",
                          fontWeight: 600,
                          fontSize: "1rem",
                          px: 4,
                          py: 1.5,
                          background: "linear-gradient(90deg, #4CAF50, #45a049)"
                        }}
                        onClick={() => handleVerify(row)}
                        disabled={row.Status !== 'pending' || verifyingRows[row.SNo]}
                      >
                        {verifyingRows[row.SNo] ? "Verifying..." : "Verify All Documents"}
                      </Button>
                    </Box>
                  </Box>

                  <Divider sx={{ mb: 3, borderColor: "rgba(255, 255, 255, 0.1)" }} />

                  {/* Bottom Section - Remarks */}
                  <Box sx={{ display: "flex", justifyContent: "center", alignItems: "flex-start" }}>
                    {/* Remarks - Full Width */}
                    <Box sx={{ flex: 1, width: "100%", mr: 3 }}>
                      <Typography variant="body2" sx={{ color: "rgba(255, 255, 255, 0.7)", mb: 0.5, fontSize: "1.5rem", textAlign: "center" }}>
                        Remarks
                      </Typography>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          backgroundColor: "rgba(0, 0, 0, 0.2)",
                          borderRadius: "6px",
                          p: 1.5,
                          fontSize: "0.8rem",
                          wordBreak: "break-word",
                          whiteSpace: "pre-line",
                          minHeight: "50px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          textAlign: "left",
                          width: "100%",
                          color: "white"
                        }}
                      >
                        {row.Remark || "No remarks"}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
}
