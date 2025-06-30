import React from "react";
import { Box, Typography, Button, Divider, Grid, Paper } from "@mui/material";
import CloseIcon from '@mui/icons-material/Close';

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
  return (
    <Paper elevation={4} sx={{ p: 4, m: 2, borderRadius: 3, background: '#181b23', color: 'white', width: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" fontWeight={700}>Document Details</Typography>
        <Button onClick={onClose} color="error" startIcon={<CloseIcon />}>Close</Button>
      </Box>
      <Divider sx={{ mb: 2, borderColor: 'rgba(255,255,255,0.1)' }} />
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={4}><b>S.No:</b> {row.SNo}</Grid>
        <Grid item xs={12} sm={6} md={4}><b>Status:</b> {row.Status}</Grid>
        <Grid item xs={12} sm={6} md={4}><b>IREPS Bill No:</b> {row.AuthorizationCommittee}</Grid>
        <Grid item xs={12} sm={6} md={4}><b>Verified At:</b> {row.VerificationTime || '-'}</Grid>
      </Grid>
      <Divider sx={{ my: 2, borderColor: 'rgba(255,255,255,0.1)' }} />
      <Typography variant="h6" sx={{ mb: 1 }}>Documents</Typography>
      <Grid container spacing={2}>
        {docFields.map(field => (
          <Grid item xs={12} sm={6} md={4} key={field.key}>
            <b>{field.label}:</b> {row[field.key as keyof DocumentRow] ? 'Uploaded' : 'Not Uploaded'}
          </Grid>
        ))}
      </Grid>
      <Divider sx={{ my: 2, borderColor: 'rgba(255,255,255,0.1)' }} />
      <Typography variant="h6" sx={{ mb: 1 }}>Remarks</Typography>
      <Box sx={{ background: 'rgba(0,0,0,0.2)', borderRadius: 2, p: 2, color: 'white', minHeight: 60 }}>
        {row.Remark || 'No remarks'}
      </Box>
    </Paper>
  );
};

export default Expanded;
