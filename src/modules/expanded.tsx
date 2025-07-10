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

const Expanded: React.FC<ExpandedProps> = ({ row, onClose }) => {
  const [showReviewCheck, setShowReviewCheck] = useState(false);
  const [loading, setLoading] = useState(false);

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
              <TableCell sx={{ color: '#fff', fontWeight: 700, textAlign: 'center' }}>Approved by</TableCell>
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
                <TableCell sx={{ color: '#fff', textAlign: 'center' }}>AI</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 3, width: '90%', mt: 10, pl: 8, pr: 5, }}>
        <Button sx={{ flex: 1, fontWeight: 700, fontSize: "1rem", p: 3, borderRadius: 4, background: '#fff', color: '#000', }} onClick={handlePassAndGenerate} disabled={loading}>
          {loading ? 'Processing...' : 'Pass & Generate Finance Note'}
        </Button>
        <Button sx={{ flex: 1, fontWeight: 700, fontSize: "1rem", p: 3, borderRadius: 4, background: '#fff', color: '#000',}} onClick={handleRejectAndGenerate} disabled={loading}> {loading ? 'Processing...' : 'Reject & Generate Return Note'}</Button>
        <Button sx={{ flex: 1, fontWeight: 700, fontSize: "1rem", p: 3, borderRadius: 4, background: '#fff', color: '#000', }} onClick={() => setShowReviewCheck(true)}>Review & Update Observatons</Button>
      </Box>
    </Paper>
  );
};

export default Expanded;
