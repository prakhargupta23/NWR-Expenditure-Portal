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
  Table, TableHead, TableRow, TableCell, TableBody, TableContainer
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import VerifiedIcon from "@mui/icons-material/Verified";
import CancelIcon from "@mui/icons-material/Cancel";
import PendingActionsIcon from "@mui/icons-material/PendingActions";
import DeleteIcon from "@mui/icons-material/Delete";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { expenditureService } from "../services/expenditure.service";
import Expanded from "./expanded";
import bg2 from '../assets/bg2.jpg';
import train from '../assets/Train.png';
import tick from '../assets/check.png';

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
  const [expandedRow, setExpandedRow] = useState<DocumentRow | null>(null);

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
        width: "95%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        borderRadius: "10px",
        backgroundColor: "rgba(0, 0, 0, 0.3)",
        border: "1px solid rgba(255, 255, 255, 1)",
        // background: `url(${bg2}) center center no-repeat`,
        // backgroundSize: `${100}% ${100}%`,
        position: 'relative',
        mt: '50px',
        fontFamily: ''
      }}
    >
      {/* <Box sx={{ mr: '20%',position: 'absolute', left: 0, right: 0, bottom: 0, display: 'flex', justifyContent: 'center', zIndex: 2, pointerEvents: 'none' }}>
        <img src={train} alt="train" style={{ width: 900, opacity: 0.1, color: '#fff', filter: 'brightness(1) invert(1)', transform: 'scaleX(-1)' }} />
      </Box> */}
      <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', mb: 2, justifyContent: 'space-between' }}>
        {/* Left: Title */}
        <Typography variant="h1" sx={{ fontWeight: 700, fontSize: '2.0rem', ml: 10, mt: 3 }}>
          Review Check
        </Typography>
        {/* Right: Search Bar */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, maxWidth: "600px", minWidth: '350px', mt: 3, mr: 7  }}>
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
              minWidth: '450px',
              '& .MuiOutlinedInput-root': {
                color: 'black',
                backgroundColor: 'rgba(254, 254, 254, 1)',
                borderRadius: '50px',
                '& fieldset': {
                  borderColor: '#fff',
                },
                '&:hover fieldset': {
                  borderColor: '#fff',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#fff',
                },
                '& input::placeholder': {
                  color: 'rgba(0, 0, 0, 0.5)',
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
              background: "linear-gradient(90deg,rgb(255, 255, 255),rgb(255, 255, 255))",
              color: "black",
              borderRadius: "50px",
              textTransform: "none",
              fontWeight: 600,
              minWidth: "auto",
              px: 3,
            }}
          >
            <SearchIcon />
          </Button>
        </Box>
      </Box>
      <hr style={{ border: '1px solid rgba(255, 255, 255, 1)', width: '100%' }} />
      

      <Paper
        elevation={3}
        sx={{
          flex: 1,
          borderRadius: "5px",
          backgroundColor: "rgba(54, 249, 220, 0.1)",
          border: "1px solid rgba(251, 249, 252, 0.2)",
          // overflow: "auto",
          maxHeight: '220vh',
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
        {expandedRow ? (
          <Expanded row={expandedRow} onClose={() => setExpandedRow(null)} />
        ) : filteredRows.length === 0 ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "50vh",
              color: "rgba(255, 255, 255, 1)",
            }}
          >
            <Typography variant="h6">
              {searchQuery ? `No documents found for IREPS number: ${searchQuery}` : "No documents added yet"}
            </Typography>
          </Box>
        ) : (
          <TableContainer sx={{ maxHeight: '100vh', minWidth: '100%' }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ background: "rgba(0, 0, 0, 1)", color: 'white', fontWeight: 'bold', textAlign: 'center' }}>S.No</TableCell>
                  <TableCell sx={{ background: "rgba(0, 0, 0, 1)", color: 'white', fontWeight: 'bold', textAlign: 'center' }}>Status</TableCell>
                  <TableCell sx={{ background: "rgba(0, 0, 0, 1)", color: 'white', fontWeight: 'bold', textAlign: 'center' }}>IREPS No.</TableCell>
                  <TableCell sx={{ background: "rgba(0, 0, 0, 1)", color: 'white', fontWeight: 'bold', textAlign: 'center' }}>Verified At</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredRows.map((row) => (
                  <TableRow key={row.SNo} hover sx={{ cursor: 'pointer', background: "rgba(0, 0, 0, 0.5)" }} onClick={() => setExpandedRow(row)}>
                    <TableCell align="center" sx={{ color: 'white' }}>{row.SNo}</TableCell>
                    <TableCell align="center">
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
                    </TableCell>
                    <TableCell align="center" sx={{ color: 'white' }}>{row.AuthorizationCommittee}</TableCell>
                    <TableCell align="center" sx={{ color: 'white' }}>{row.VerificationTime || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Box>
  );
}
