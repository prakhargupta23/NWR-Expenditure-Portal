import React, { useState } from "react";
import { Box, Typography, Button, Divider, Grid, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from "@mui/material";
import CloseIcon from '@mui/icons-material/Close';
import ReviewCheck from './ReviewCheck';
import { expenditureService } from "../services/expenditure.service";

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

interface ExpandedProps {
  row: DocumentRow;
  onClose: () => void;
}

const docFields = [
  { key: "ReceiptNote", label: "Receipt Note" },
  { key: "TaxInvoice", label: "Tax Invoice" },
  { key: "GSTInvoice", label: "GST Invoice" },
  { key: "ModificationAdvice", label: "Modification Advice" },
  { key: "PurchaseOrder", label: "Purchase Order" },
  { key: "InspectionCertificate", label: "Inspection Certificate" },
];

const parseMatchedUnmatched = (remark: string) => {
  if (!remark) return { matched: [], unmatched: [] };
  const lines = remark.split(/\n|\r/).map(line => line.trim());
  let matched: string[] = [], unmatched: string[] = [];
  let current: 'matched' | 'unmatched' | null = null;
  for (const line of lines) {
    if (/^Matched Results$/i.test(line)) {
      current = 'matched';
      continue;
    }
    if (/^Unmatched Results$/i.test(line)) {
      current = 'unmatched';
      continue;
    }
    if (line.startsWith('•')) {
      if (current === 'matched') matched.push(line.slice(1).trim());
      else if (current === 'unmatched') unmatched.push(line.slice(1).trim());
    }
  }
  return { matched, unmatched };
};

const Expanded: React.FC<ExpandedProps> = ({ row, onClose }) => {
  const [showReviewCheck, setShowReviewCheck] = useState(false);
  const [loading, setLoading] = useState(false);
  const { matched, unmatched} = parseMatchedUnmatched(row.Remark);
  const allPoints = [
    ...unmatched.map(point => ({ point, status: 'Mismatch' as const })),
    ...matched.map(point => ({ point, status: 'Match' as const })),
  ];

  if (showReviewCheck) {
  return (
      <Box sx={{ width: '100%', minHeight: '100%', display: 'flex', flexDirection: 'column', alignItems: 'left', justifyContent: 'flex-start', pt: 2 }}>
        <Box sx={{ width: '100%', maxWidth: 500, display: 'flex', alignItems: 'center', mb: 2 }}>
          <Button onClick={() => setShowReviewCheck(false)} sx={{ color: '#222', background: 'rgba(255,255,255,0.7)', ml: 2, fontWeight: 700, borderRadius: 2 }}>
            Back
          </Button>
        </Box>
        <ReviewCheck row={row} />
      </Box>
    );
  }

  const handlePassAndGenerate = async () => {
    setLoading(true);
    try {
      const updatedRow: DocumentRow = {
        ...row,
        Status: 'approved',
        VerificationTime: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      };
      await expenditureService.updateExpenditureData(updatedRow);
      onClose();
    } catch (error) {
      console.error('Error approving document:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRejectAndGenerate = async () => {
    setLoading(true);
    try {
      const updatedRow: DocumentRow = {
        ...row,
        Status: 'rejected',
        VerificationTime: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      };
      await expenditureService.updateExpenditureData(updatedRow);
      onClose();
    } catch (error) {
      console.error('Error approving document:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (docType: string, file: File) => {
    setLoading(true);
    try {
      type DocumentTypeKey =
        | "ReceiptNote"
        | "TaxInvoice"
        | "GSTInvoice"
        | "ModificationAdvice"
        | "PurchaseOrder"
        | "InspectionCertificate";
      await expenditureService.getdata(file, docType as DocumentTypeKey, row.SNo);

      // Update the row to reflect the uploaded document
      row[docType as DocumentTypeKey] = file.name; // or `true` if you don't want to show the name

      // Update the row in the database
      await expenditureService.updateExpenditureData(row);

      // If you want to trigger a re-render, use a state for row and update it here
      // setRow({ ...row, [docType]: file.name });

    } catch (error) {
      console.error('Error uploading file:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper elevation={4} sx={{ p: 2, m: 2, borderRadius: 10, backgroundColor: "rgba(0, 0, 0, 0)", color: 'white', width: '95%' }}>
      {/* Document Details Table */}
      <TableContainer sx={{ margin: '0 auto' }}>
        <Table sx={{ minWidth: '100%', alignItems: 'center' }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ background: "rgba(0, 0, 0, 0.8)", color: '#fff', fontWeight: 700, width: '25%', textAlign: 'center' }}>S.No</TableCell>
              <TableCell sx={{ background: "rgba(0, 0, 0, 0.8)", color: '#fff', fontWeight: 700, width: '25%', textAlign: 'center' }}>Status</TableCell>
              <TableCell sx={{ background: "rgba(0, 0, 0, 0.8)", color: '#fff', fontWeight: 700, width: '25%', textAlign: 'center' }}>IREPS Bill No</TableCell>
              <TableCell sx={{ background: "rgba(0, 0, 0, 0.8)", color: '#fff', fontWeight: 700, width: '25%', textAlign: 'center' }}>Verified At</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell sx={{ color: '#fff', width: '25%', textAlign: 'center' }}>{row.SNo}</TableCell>
              <TableCell sx={{ color: '#fff', width: '25%', textAlign: 'center', textTransform: 'capitalize' }}>{row.Status}</TableCell>
              <TableCell sx={{ color: '#fff', width: '25%', textAlign: 'center' }}>{row.AuthorizationCommittee}</TableCell>
              <TableCell sx={{ color: '#fff', width: '25%', textAlign: 'center' }}>{row.VerificationTime || '-'}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
      <Divider sx={{ my: 2, borderColor: 'rgba(255,255,255,0)' }} />
      {/* Document Upload Status Table */}
      {/* <Typography variant="h6" sx={{ mb: 1 }}>Documents</Typography> */}
      <TableContainer sx={{ width: '80%', padding: '10px', margin: '0 auto', background: 'rgba(0,0,0,0.5)', borderRadius: '20px' }}>
        <Table sx={{ minWidth: 400 }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ color: '#fff', fontWeight: 700, textAlign: 'left' }}>Document Type</TableCell>
              <TableCell sx={{ color: '#fff', fontWeight: 700, textAlign: 'center' }}>Status</TableCell>
              <TableCell sx={{ color: '#fff', fontWeight: 700, textAlign: 'center' }}>Upload</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
        {docFields.map(field => (
              <TableRow key={field.key}>
                <TableCell sx={{ color: '#fff', textAlign: 'left' }}>{field.label}</TableCell>
                <TableCell sx={{ color: '#fff', textAlign: 'center' }}>
                  <Box
                    sx={{
                      width: '60%',
                      height: 6,
                      borderRadius: 3,
                      background: row[field.key as keyof DocumentRow] ? '#4caf50' : '#f44336',
                      margin: '0 auto'
                    }}
                  />
                </TableCell>
                <TableCell sx={{ color: '#fff', textAlign: 'center' }}>
                  <Button
                    variant="contained"
                    component="label"
                    size="small"
                    sx={{ background: 'rgb(0, 9, 129)', color: '#fff', fontWeight: 700, borderRadius: 2, textTransform: 'none' }}
                  >
                    Upload
                    <input
                      type="file"
                      hidden
                      onChange={e => {
                        if (e.target.files && e.target.files[0]) {
                          // Call a handler for file upload, pass field.key and file
                          handleFileUpload(field.key, e.target.files[0]);
                        }
                      }}
                    />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      {/* Add Verify by AI button below the upload table */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
        <Button
          variant="contained"
          color="secondary"
          disabled={loading || row.Status !== 'pending'}
          onClick={async () => {
            setLoading(true);
            try {
              await expenditureService.reportVerification(row);
              // Optionally, refresh or show a success message
            } catch (error) {
              console.error('Error verifying by AI:', error);
            } finally {
              setLoading(false);
            }
          }}
          sx={{ fontWeight: 700, borderRadius: 2, textTransform: 'none', background: '#00C49F', color: '#fff', px: 4, py: 1.5 }}
        >
          {loading ? 'Verifying...' : 'Verify by AI'}
        </Button>
      </Box>
      {/* <Box sx={{
        dispaly: 'flex', flexDirection: 'row',alignItems: 'center',width: '100%',justifyContent: 'center',mt: 7,background: 'rgba(0,0,0,0.5)',pt: 6, p: 5,borderRadius: 5, height:'50vh',overflowY: 'auto',overflow: 'hidden'
      }}>
        

      <Box sx={{m:0,height: '50vh', overflowY: 'auto',position: 'relative'}}> */}

        {/* <Typography sx={{color: '#f44336',fontWeight:700}}>Not Matching</Typography>
        <ul>
          {unmatched.map((point,idx) =>  <li key={idx}>{point}</li>)}
        </ul>

        <Typography sx={{color: '#4caf50',fontWeight:700}}>Matching</Typography>
        <ul>
          {matched.map((point,idx) =>  <li key={idx}>{point}</li>)}
        </ul> */}
          <Divider sx={{ mb: 2 }} />
          {allPoints.length === 0 ? (
            <Typography variant="body2" sx={{ color: '#444' }}>No review remarks available.</Typography>
          ) : (
          <>
            <TableContainer sx={{ maxHeight: 500, overflowY: 'auto', background: "rgba(0, 0, 0, 0.5)" }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ background: '#000', color: '#fff', textAlign: 'center', fontWeight: 700 }}>Remarks</TableCell>
                    <TableCell sx={{ background: '#000', color: '#fff', textAlign: 'center', fontWeight: 700 }}>Status</TableCell>
                    <TableCell sx={{ background: '#000', color: '#fff', textAlign: 'center', fontWeight: 700 }}>Reviewed By</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {allPoints.map(({ point, status }, idx) => (
                    <TableRow key={idx}>
                      
                      <TableCell sx={{ color: '#fff', textAlign: 'left' }}>{point}</TableCell>
                      <TableCell sx={{ color: status === 'Match' ? '#4caf50' : '#f44336', textAlign: 'center', fontWeight: 700 }}>{status}</TableCell>
                      <TableCell sx={{ color: '#fff', textAlign: 'center', fontWeight: 700 }}>AI</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </>
          )}
      {/* </Box> */}
      {/* </Box> */}
      <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, width: '60%', mt: 5, pl: 25, pr: 10, }}>
        <Button sx={{ flex: 1, fontWeight: 700, fontSize: "0.9rem", p: 1, borderRadius: 4, background: '#00D1FF', color: '#fff', }} onClick={handlePassAndGenerate} disabled={loading}>
          {loading ? 'Processing...' : 'Pass & Generate Finance Note'}
        </Button>
        <Button sx={{ flex: 1, fontWeight: 700, fontSize: "0.9rem", p: 1, borderRadius: 4, background: '#FF3B3F', color: '#fff',}} onClick={handleRejectAndGenerate} disabled={loading}> {loading ? 'Processing...' : 'Reject & Generate Return Note'}</Button>
        <Button sx={{ flex: 1, fontWeight: 700, fontSize: "0.9rem", p: 1, borderRadius: 4, background: '#6A5ACD', color: '#fff', }} onClick={() => setShowReviewCheck(true)}>Review & Update Observatons</Button>
      </Box>
    </Paper>
  );
};

export default Expanded;
