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
import aiIcon from "../assets/artificial-intelligence.png";
import ReviewCheck from './ReviewCheck';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import bg1 from '../assets/bg1.jpg';
import train from '../assets/Train.png';
import cloud from '../assets/cloud.png';
import Expanded from './expanded';
import { SportsRugbySharp } from "@mui/icons-material";

export interface DocumentRow {
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

type Tab = "dashboard" | "document" | "review";

interface DocumentUploadProps {
  onTabChange: (tab: Tab) => void;
}
// interface DocumentUploadProps {
//   onTabChange?: (tab: string) => void;
// }

export default function DocumentUpload({ onTabChange }: DocumentUploadProps) {
  const [rows, setRows] = useState<DocumentRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<{[key: string]: boolean}>({});
  const [verifyingRows, setVerifyingRows] = useState<{[key: number]: boolean}>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredRows, setFilteredRows] = useState<DocumentRow[]>([]);
  // const [showReviewCheck, setShowReviewCheck] = useState(false); // Removed
  const [expandedRow, setExpandedRow] = useState<DocumentRow | null>(null);


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

  // Removed showReviewCheck logic if not needed

  const handlePass = async (row: DocumentRow) => {
    try {
      console.log("ipdate start")
      const updatedRow: DocumentRow = {
        ...row,
        Status: 'approved',
        VerificationTime: formatIndianDateTime(new Date()),
      };
      console.log("djsbafdkj",updatedRow)
      await expenditureService.updateExpenditureData(updatedRow);
      setRows(rows.map(r => r.SNo === row.SNo ? updatedRow : r));
    } catch (error) {
      console.error('Error approving document:', error);
    }
  };

  const handleReject = async (row: DocumentRow) => {
    try {
      console.log("reject start");
      const updatedRow: DocumentRow = {
        ...row,
        Status: 'rejected',
        VerificationTime: formatIndianDateTime(new Date()),
      };
      console.log("reject update", updatedRow);
      await expenditureService.updateExpenditureData(updatedRow);
      setRows(rows.map(r => r.SNo === row.SNo ? updatedRow : r));
    } catch (error) {
      console.error('Error rejecting document:', error);
    }
  };

  if (expandedRow) {
    return <Expanded row={expandedRow} onClose={() => setExpandedRow(null)} />;
  }

  return (
    <Box
      sx={{
        height: "100%",
        color: "white",
        background: 'rgba(0,0,0,0)',
        borderRadius: 10,
        p: 3,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        fontFamily: 'Montserrat',
        
      }}
    >
      {/* Header Section */}
      <Box sx={{ mb: 0.5, mr: 2 }}>
        <Box sx={{ display: "flex", justifyContent: "flex-end", alignItems: "center", mb: 0.5 }}>
          <Button
            variant="contained"
            size="small"
            startIcon={<AddIcon />}
            onClick={addNewRow}
            sx={{
              background: 'linear-gradient(90deg, rgba(54, 249, 220, 0.4), rgba(54, 249, 220, 0.5))',
              color: "white",
              borderRadius: "6px",
              textTransform: "none",
              fontWeight: 600,
              fontSize: "0.8rem",
              px: 2,
              py: 0.5,
              letterSpacing: '0.05em',
            }}
          >
            Add New Document
          </Button>
        </Box>
      </Box>

      {/* Content Section */}
      <Box sx={{ flex: 1, overflow: "hidden", 
        }}>
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
            <Typography variant="h6" sx={{ letterSpacing: '0.05em' }}>
              {searchQuery ? `No documents found for IREPS number: ${searchQuery}` : "No documents added yet"}
            </Typography>
          </Box>
        ) : (
          <Box sx={{ height: "100%", p: 2 }}>
            {filteredRows.map((row) => (
              <Card
                key={row.SNo}
                sx={{
                  // backgroundColor: "rgba(255,255,255,0)",
                  border: "1px solid #e0e0e0",
                  borderRadius: "12px",
                  height: "100%",
                  boxShadow: "0 8px 25px rgba(80,80,80,0.08)",
                  transition: "transform 0.2s ease-in-out",
                  "&:hover": {
                    boxShadow: "0 8px 25px rgba(80,80,80,0.15)",
                  },
                  // background: `url(${bg1}) center center no-repeat`,
                  // backgroundSize: `${100}% ${100}%`,
                  background: 'rgba(0,0,0,0.5)',
                  position: 'relative',
                }}
              >
                {/* Train image overlay */}
                {/* <Box sx={{ ml: '20%',position: 'absolute', left: 0, right: 0, bottom: 290, display: 'flex', justifyContent: 'center', zIndex: 2, pointerEvents: 'none' }}>
                  <img src={train} alt="train" style={{ width: 900, opacity: 0.2, color: '#fff', filter: 'brightness(1) invert(1)' }} />
                </Box> */}
                <Box sx={{
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'left',
                  // justifyContent: 'center', // Center horizontally
                  mb: 0,
                  mt: 1,
                  width: '100%',
                }}>
                  <Box
                    sx={{
                      width: 70,
                      height: 70,
                      borderRadius: '50%',
                      background: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      ml: 15,
                      mr: 10,
                      mt: 2,
                      mb: 1,
                      // boxShadow: 2,
                    }}
                  >
                    {/* <CloudUploadIcon sx={{ backgroundColor: '#fff', color: '#000', fontSize: 50 }} /> */}
                    <img src={cloud} alt="tick" style={{ 
                        width: 50, 
                        fontWeight: 400, 
                        color: '#fff', 
                        borderRadius: '50%', 
                        marginTop: 10, 
                        marginBottom: 5, 
                        marginLeft: 80, 
                        marginRight: 70,
                        // border: '4px solid #fff',
                        padding: '5px',
                        // backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    }} />
                  </Box>
                  <Box sx={{ textAlign: 'left',mt: 3,mb: 1 }}>
                    <Typography variant="h5" sx={{ color: 'rgba(255,255,255,1)', fontSize: '30px', fontWeight: 700, lineHeight: 1.2, }}>
                      Document Upload
                    </Typography>
                    <Typography variant="subtitle1" sx={{ color: 'rgba(255,255,255,0.8)', fontSize: '18px', fontWeight: 600, lineHeight: 1.5, }}>
                      Select and upload the files of your choice
                    </Typography>
                    
                  </Box>
                </Box>
                <hr style={{ border: '1px solid rgba(255, 255, 255, 1)', width: '100%' }} />


                <CardContent sx={{ p: 3, height: "100%", display: "flex", flexDirection: "column", paddingLeft: '3%', paddingRight: '3%' }}>
                  {/* Top Section - SNo, Status, and IREPS */}
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", p: 2, mb: 3, border: "2px solid rgba(255, 255, 255, 1)", borderRadius: "12px" }}>
                    {/* SNo - Top Left */}
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 'bold', color: "rgba(255, 255, 255, 1)", mb: 0.5, fontSize: "1rem", letterSpacing: '0.05em' }}>
                        S.No
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: "bold", color: "#fff", fontSize: "1.2rem", letterSpacing: '0.05em' }}>
                        {row.SNo}
                      </Typography>
                    </Box>

                    {/* Status - Center */}
                    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                      <Typography variant="body2" sx={{ fontWeight: 'bold', color: "rgba(255, 255, 255, 1)", mb: 0.5, fontSize: "1rem", letterSpacing: '0.05em' }}>
                        Status
                      </Typography>
                      <Chip
                        label={getStatusText(row.Status)}
                        color={getStatusColor(row.Status) as any}
                        size="small"
                        icon={getVerificationIcon(row.Status)}
                        sx={{ fontWeight: 600, fontSize: "0.8rem", p: 0.5, letterSpacing: '0.05em' }}
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
                            py: 0.5,
                            fontFamily: 'Montserrat, sans-serif',
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
                      <Typography variant="body2" sx={{ fontWeight: 'bold', color: "rgba(255, 255, 255, 1)", mb: 0.5, fontSize: "1rem", letterSpacing: '0.05em' }}>
                        IREPS Bill No.
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: "bold", color: "white", fontSize: "1.2rem", letterSpacing: '0.05em' }}>
                        {row.AuthorizationCommittee}
                      </Typography>
                    </Box>
                  </Box>

                  

                  {/* <Divider sx={{ mb: 3, borderColor: "rgba(255, 255, 255, 0.1)" }} /> */}

                  {/* Center Section - Document Upload Buttons */}
                  <Box sx={{ flex: 1, mb: 3, p: 2 }}>
                    
                    
                    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", width: '100%' }}>
                      {documentTypes.map((docType) => {
                        const file = row[docType.key as keyof DocumentRow] as string | null;
                        const isNull = file === null;
                        const isUploading = uploadingFiles[`${row.SNo}-${docType.key}`];
                        return (
                          <React.Fragment key={docType.key}>
                            <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', width: '100%', minWidth: '320px', py: 1 }}>
                              {/* Label left aligned */}
                              <Typography sx={{ flex: 2, textAlign: 'left', fontWeight: 500, fontSize: '1rem', color: '#fff', pl: 1, letterSpacing: '0.05em' }}>
                                {docType.label}
                              </Typography>
                              {/* Success icon in the center if file uploaded */}
                              <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                {file && <CheckCircleIcon color="success" />}
                              </Box>
                              {/* Upload button right aligned */}
                              <label htmlFor={`file-upload-${row.SNo}-${docType.key}`} style={{ flex: 2, display: 'flex', justifyContent: 'flex-end' }}>
                            <input
                              accept="*"
                              style={{ display: "none" }}
                              id={`file-upload-${row.SNo}-${docType.key}`}
                              type="file"
                              onChange={(e) => handleFileUpload(row.SNo, docType.key as DocumentType, e)}
                              disabled={!isNull || isUploading}
                            />
                                <IconButton
                                  component="span"
                                  disabled={!isNull || isUploading}
                                  sx={{ color: !isNull ? '#fff' : 'inherit', p: 1, border: '2px solid rgba(255,255,255,1)', background: 'white' }}
                                >
                                  {isUploading ? <CircularProgress size={18} color="inherit" /> : <CloudUploadIcon />}
                                </IconButton>
                            </label>
                          </Box>
                            <Divider sx={{ width: '100%', background: 'rgba(255,255,255,0.15)' }} />
                          </React.Fragment>
                        );
                      })}
                    </Box>

                    {/* Verify Button Below Upload Buttons */}
                    <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
                      <Button
                        variant="contained"
                        color="success"
                        size="large"
                        startIcon={
                          verifyingRows[row.SNo]
                            ? <CircularProgress size={20} color="inherit" />
                            : <img src={aiIcon} alt="AI" style={{ width: 24, height: 24, objectFit: 'contain' }} />
                        }
                        sx={{
                          borderRadius: "70px",
                          textTransform: "none",
                          fontWeight: 600,
                          fontSize: "1rem",
                          px: 4,
                          py: 1.5,
                          color: 'black',
                          background: "linear-gradient(90deg,rgb(255, 255, 255),rgb(255, 255, 255))",
                          letterSpacing: '0.05em',
                        }}
                        onClick={() => handleVerify(row)}
                        disabled={row.Status !== 'pending' || verifyingRows[row.SNo]}
                      >
                        {verifyingRows[row.SNo] ? "Verifying..." : "Verify using AI agent"}
                      </Button>
                    </Box>
                    {/* Pass, Reject, Review Check Buttons */}
                    <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', width: '100%', }}>
                    <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, width: '60%', mt: 10, }}>
                      <Button 
                        sx={{ flex: 1, fontWeight: 700, fontSize: "1.1rem", py: 2, borderRadius: 2, 
                          background: row.Status === 'pending'? 'rgb(246, 186, 47)' : (row.Status === 'approved'? 'rgb(58, 255, 51)':'rgb(254, 22, 22)'), 
                          color: '#fff', }}
                        // onClick={() => handlePass(row)}
                      > 
                        {row.Status === 'pending'? 'Pending': (row.Status === 'approved'? 'Pass':'Reject')}
                      </Button>
                      {/* <Button sx={{ flex: 1, fontWeight: 700, fontSize: "1.1rem", py: 3, borderRadius: 2, background: '#fff', color: '#000', }} onClick={() => handleReject(row)}>Reject</Button> */}
                      <Button sx={{ flex: 1, fontWeight: 700, fontSize: "1.1rem", py: 2, borderRadius: 2, background: '#fff', color: '#000', }} onClick={() => setExpandedRow(row)}>Review Check</Button>
                    </Box>
                    </Box>
                    {/* Remove the old ReviewCheck rendering */}
                    {/* {showReviewCheck && (
                      <Box sx={{ mt: 3 }}>
                        <ReviewCheck />
                      </Box>
                    )} */}
                  </Box>


                  {/* Bottom Section - Remarks */}
                  {/* <Box sx={{ display: "flex", justifyContent: "center", alignItems: "flex-start" }}>
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
                  </Box> */}
                </CardContent>
              </Card>
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
}
