import React, { useState } from "react";
import { Box, Typography, Button, Divider, Grid, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Dialog, DialogTitle, DialogContent, DialogActions, TextField } from "@mui/material";
import CloseIcon from '@mui/icons-material/Close';
import ReviewCheck from './ReviewCheck';
import { expenditureService } from "../services/expenditure.service";
import { jsPDF } from "jspdf";

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

  const [openFinanceModal, setOpenFinanceModal] = useState(false);
  const [financeInputs, setFinanceInputs] = useState({
    co6No: '',
    ld: '',
    otherDeductions: '',
    netPayment: ''
  });

  const returnReasons = [
    "Manufacturer’s Authorization (MA) required for Delivery Period extension — please attach.",
    "Invoice details not reflected in GSTR-2A for Invoice No.",
    "Copy of Tax Invoice / IC not attached.",
    "Invoice Number mismatch between bill and supporting documents.",
    "Refund undertaking not attached.",
    "Passing a duplicate invoice for the same supplier in the same financial year is not permissible. Invoice already passed against CO6 Number."
  ];

  const [openReturnModal, setOpenReturnModal] = useState(false);
  const [returnInputs, setReturnInputs] = useState(
    returnReasons.map(reason => ({ reason, remark: '' }))
  );

  const handleReturnRemarkChange = (idx: number, value: string) => {
    setReturnInputs(prev => prev.map((item, i) => i === idx ? { ...item, remark: value } : item));
  };

  // Helper to extract reviewer, review time, and review remark from point text
  function extractReviewer(point: string): { text: string, reviewer: string, reviewTime: string, reviewRemark: string } {
    // Match pattern: ... (REVIEWEDBY (REVIEWTIME)(REMARK)) at the end
    // const match = point.match(/^(.*)\(([^()]*)\s*\(([^()]*)\)\(([^()]*)\)\(([^()]*)\)\)$/);
    const match = point.match(/^(.*)\(([^()]+)\s*\(([^()]*)\)\s*\(([^()]*)\)\s*\(([^()]*)\)\)$/);
    // console.log("daasdfghj",match)
    if (match) {
      const [fulltext, fullMatch, aiText, firstVal, secondVal, thirdVal] = match;
      // return {
      //   text: match[1].trim(),
      //   reviewer: match[3].trim(),
      //   reviewTime: match[4].trim(),
      //   reviewRemark: match[5].trim(),
      // };
      return {
        text: fullMatch,
        reviewer: aiText,
        reviewTime:firstVal,
        reviewRemark:secondVal
      }
    }
    // Fallback: try to extract at least the reviewer
    const fallback = point.match(/^(.*)\(([^)]+)\)\s*$/);
    if (fallback) {
      return {
        text: fallback[1].trim(),
        reviewer: fallback[2].trim(),
        reviewTime: '-',
        reviewRemark: '-',
      };
    }
    return { text: point, reviewer: '-', reviewTime: '-', reviewRemark: '-' };
  }

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

  const handlePassAndGenerate = async (inputs?: any) => {
    setLoading(true);
    try {
      // Fetch all GST invoice data
      const gstDataFetched = await expenditureService.getGstInvoiceData();
      const gstDataArray = gstDataFetched.data;
      // Find the GST data object matching the current row's SNo
      const matchedGstData = gstDataArray.find((item: any) => String(item.SNo) === String(row.SNo));
      const doc = new jsPDF();
      const leftPad = 20;
      const rightPad = 190;
      let y = 25;
      // Heading
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('Approval Note', leftPad, y);
      y += 14;
      doc.setFontSize(14);
      doc.setFont('helvetica', 'normal');
      doc.text('Subject: Approval for Payment Processing', leftPad, y);
      y += 16;
      // Table header with shaded background
      doc.setFillColor(230, 230, 250);
      doc.rect(leftPad, y - 7, rightPad - leftPad, 10, 'F');
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Sr. No.', leftPad + 2, y);
      doc.text('Details', leftPad + 28, y);
      doc.text('Remarks', leftPad + 95, y);
      y += 7;
      doc.setLineWidth(0.5);
      doc.line(leftPad, y, rightPad, y);
      y += 4;
      // Table rows
      const tableRows = [
        { no: '1.', detail: 'Purchase Order (P.O.) Number', key: 'PONo' },
        { no: '2.', detail: 'Consignee', key: 'Consignee' },
        { no: '3.', detail: 'Bill Passed Vide CO6 No.', value: inputs?.co6No || '' },
        { no: '4.', detail: 'Invoice Number & Date', key: '' },
        { no: '5.', detail: 'Receipt Note Number', key: 'RNoteNo' },
        { no: '6.', detail: 'Material Received On', key: '' },
        { no: '7.', detail: 'Quantity Accepted', key: 'QtyAccepted' },
        { no: '8.', detail: 'Liquidated Damages (L.D)', value: inputs?.ld || '' },
        { no: '9.', detail: 'Security Deposit (S.D)', key: 'Security' },
        { no: '10.', detail: 'Other Deductions (if any)', value: inputs?.otherDeductions || '' },
        { no: '11.', detail: 'Net Payment Recommended', value: inputs?.netPayment || '' },
      ];
      doc.setFont('helvetica', 'normal');
      tableRows.forEach((rowItem, idx) => {
        let remarks = '';
        if (rowItem.value !== undefined) {
          remarks = rowItem.value;
        } else if (rowItem.key && matchedGstData && matchedGstData[rowItem.key] != null) {
          if (rowItem.detail === 'Invoice Number & Date') {
            remarks = `${matchedGstData['InvoiceNo'] || ''} ${matchedGstData['InvoiceDate'] || ''}`.trim();
          } else {
            remarks = String(matchedGstData[rowItem.key]);
          }
        } else if (rowItem.detail === 'Invoice Number & Date' && matchedGstData) {
          remarks = `${matchedGstData['InvoiceNo'] || ''} ${matchedGstData['InvoiceDate'] || ''}`.trim();
        }
        doc.text(rowItem.no, leftPad + 2, y);
        doc.text(rowItem.detail, leftPad + 28, y);
        doc.setTextColor(80, 80, 80);
        doc.text(remarks, leftPad + 95, y);
        doc.setTextColor(0, 0, 0);
        y += 9;
        if (y > 265) { doc.addPage(); y = 25; }
      });
      y += 4;
      doc.setLineWidth(0.2);
      doc.setDrawColor(180, 180, 180);
      doc.line(leftPad, y, rightPad, y);
      y += 14;
      // Conclusion section with highlight
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(0, 51, 102);
      doc.text('Conclusion:', leftPad, y);
      y += 8;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.setTextColor(60, 60, 60);
      doc.text('The above details have been checked and verified as per agreement terms and internal guidelines. Recommended for payment.', leftPad, y, { maxWidth: rightPad - leftPad });
      doc.setTextColor(0, 0, 0);
      doc.save(`Finance_Note_SNo_${row.SNo}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRejectAndGenerate = async () => {
    setOpenReturnModal(true);
  };

  const handleReturnModalSubmit = async () => {
    setOpenReturnModal(false);
    // Map remarks to keys
    const mapping = {
      MA: 0, // Manufacturer’s Authorization (MA) required for Delivery Period extension — please attach.
      GSTR2A: 1, // Invoice details not reflected in GSTR-2A for Invoice No.
      CopyTaxIC: 2, // Copy of Tax Invoice / IC not attached.
      InvoiceMismatch: 3, // Invoice Number mismatch between bill and supporting documents.
      Refund: 4, // Refund undertaking not attached.
      InvoiceCO6: 5 // Passing a duplicate invoice for the same supplier in the same financial year is not permissible. Invoice already passed against CO6 Number.
    };
    const returnNoteData = {
      SNo: row.SNo,
      MA: returnInputs[mapping.MA]?.remark || '',
      GSTR2A: returnInputs[mapping.GSTR2A]?.remark || '',
      CopyTaxIC: returnInputs[mapping.CopyTaxIC]?.remark || '',
      InvoiceMismatch: returnInputs[mapping.InvoiceMismatch]?.remark || '',
      Refund: returnInputs[mapping.Refund]?.remark || '',
      InvoiceCO6: returnInputs[mapping.InvoiceCO6]?.remark || ''
    };
    // Send to backend
    try {
      await expenditureService.putNoteData(returnNoteData, 'RejectionNote');
    } catch (err) {
      console.error('Error saving return note:', err);
    }
    // Then generate the PDF
    await handleRejectAndGeneratePDF(returnInputs);
  };

  const handleRejectAndGeneratePDF = async (reasons: { reason: string, remark: string }[]) => {
    setLoading(true);
    try {
      // Fetch all GST invoice data
      const gstDataFetched = await expenditureService.getGstInvoiceData();
      const gstDataArray = gstDataFetched.data;
      // Find the GST data object matching the current row's SNo
      const matchedGstData = gstDataArray.find((item: any) => String(item.SNo) === String(row.SNo));
      let unmatchedResults: { text: string, reviewer: string, reviewTime: string, reviewRemark: string }[] = [];
      if (matchedGstData && matchedGstData.Remarks) {
        try {
          // Use parseMatchedUnmatched to extract unmatched points
          const { unmatched } = parseMatchedUnmatched(matchedGstData.Remarks);
          // Process each unmatched point with extractReviewer
          const processedUnmatched = unmatched.map(point => extractReviewer(point));
          console.log("lllllll", processedUnmatched);
          unmatchedResults = processedUnmatched;
        } catch (e) {
          // If parsing fails, leave unmatchedResults empty
        }
      }
      const doc = new jsPDF();
      const leftPad = 20;
      let y = 25;
      // Heading with shaded background
      doc.setFillColor(255, 255, 255);
      doc.rect(leftPad - 8, y - 12, 170, 14, 'F');
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 51, 153);
      doc.text('Return / Rejection Note', leftPad, y);
      y += 10;
      doc.setDrawColor(0, 51, 153);
      doc.setLineWidth(1);
      doc.line(leftPad - 8, y, leftPad + 162, y);
      y += 8;
      doc.setFontSize(14);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      doc.text('Subject: Return of Bill / Invoice for Compliance', leftPad, y);
      y += 12;
      doc.setFontSize(12);
      doc.text('The following observations need to be addressed before the bill can be processed:', leftPad, y);
      y += 8;
      // Print reasons and remarks
      if (reasons && reasons.length > 0) {
        reasons.forEach(({ reason, remark }, idx) => {
          const reasonLines = doc.splitTextToSize(`${idx + 1}. ${reason}`, 160);
          reasonLines.forEach((line: string) => {
            if (y > 270) { doc.addPage(); y = 25; }
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(11);
            doc.text(line, leftPad, y);
            y += 6;
          });
          const displayRemark = remark && remark.trim() !== '' ? remark : 'N/A';
          const remarkLines = doc.splitTextToSize(`Remark: ${displayRemark}`, 150);
          remarkLines.forEach((line: string) => {
            if (y > 270) { doc.addPage(); y = 25; }
            doc.setFont('helvetica', 'italic');
            doc.setFontSize(10);
            doc.setTextColor(120, 0, 0);
            doc.text(line, leftPad + 8, y);
            y += 5;
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(11);
            doc.setTextColor(0, 0, 0);
          });
        });
      }
      // Add the fixed line before unmatched points
      y += 6;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(0, 51, 153);
      doc.text('Please rectify the above points and resubmit for bill passing.', leftPad, y);
      y += 10;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.setTextColor(0, 0, 0);
      // Bullet points section for unmatched results
      if (unmatchedResults.length > 0) {
        unmatchedResults.forEach((pointObj, idx) => {
          const text = pointObj.text || pointObj;
          const lines = doc.splitTextToSize(`${idx + 1}. ${text}`, 160);
          lines.forEach((line: string) => {
            if (y > 270) { doc.addPage(); y = 25; }
            doc.text(line, leftPad, y);
            y += 6;
          });
        });
      } else {
        doc.text('No specific remarks found.', leftPad, y);
        y += 8;
      }
      doc.save(`Return_Note_SNo_${row.SNo}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
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

  const handleVerifyByAI = async () => {
    setLoading(true);
    try {
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
          VerificationTime: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        };

        console.log("Preparing to update database with row:", {
          SNo: updatedRow.SNo,
          Status: updatedRow.Status,
          Remark: updatedRow.Remark
        });

        // Update the backend
        await expenditureService.updateExpenditureData(updatedRow);
        
        // Update the local row state
        Object.assign(row, updatedRow);
        
        console.log("Row updated successfully");
      }
    } catch (error) {
      console.error('Error verifying by AI:', error);
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
                    disabled={row.Status !== 'pending' || !!row[field.key as keyof DocumentRow]}
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
          onClick={handleVerifyByAI}
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
                    <TableCell sx={{ background: '#000', color: '#fff', textAlign: 'center', fontWeight: 700 }}>Review Time</TableCell>
                    <TableCell sx={{ background: '#000', color: '#fff', textAlign: 'center', fontWeight: 700 }}>Review Remark</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {allPoints.map(({ point, status }, idx) => {
                    const { text, reviewer, reviewTime, reviewRemark } = extractReviewer(point);
                    return (
                    <TableRow key={idx}>
                        <TableCell sx={{ color: '#fff', textAlign: 'left' }}>{text}</TableCell>
                      <TableCell sx={{ color: status === 'Match' ? '#4caf50' : '#f44336', textAlign: 'center', fontWeight: 700 }}>{status}</TableCell>
                        <TableCell sx={{ color: '#fff', textAlign: 'center', fontWeight: 700 }}>{reviewer}</TableCell>
                        <TableCell sx={{ color: '#fff', textAlign: 'center', fontWeight: 700 }}>{reviewTime}</TableCell>
                        <TableCell sx={{ color: '#fff', textAlign: 'center', fontWeight: 700 }}>{reviewRemark}</TableCell>
                    </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </>
          )}
      {/* </Box> */}
      <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, width: '60%', mt: 5, pl: 25, pr: 10, }}>
        <Button
          sx={{ flex: 1, fontWeight: 700, fontSize: "0.9rem", p: 1, borderRadius: 4, background: '#00D1FF', color: '#fff', }}
          onClick={async () => {
            setLoading(true);
            try {
              const noteDataResponse = await expenditureService.getNoteData('FinanceNote', row.SNo);
              const noteData = noteDataResponse?.data;
              console.log("jjj",noteDataResponse,noteData)
              if (noteData) {
                // If data is present, use it to generate the PDF
                const financeInputs = {
                  co6No: noteData.CO6No || '',
                  ld: noteData.Ld || '',
                  otherDeductions: noteData.Otherdedunctions || '',
                  netPayment: noteData.NetPayment || ''
                };
                await handlePassAndGenerate(financeInputs);
              } else {
                // If no data, open the dialog to take inputs
                setOpenFinanceModal(true);
              }
            } catch (err) {
              // On error, fallback to opening the dialog
              setOpenFinanceModal(true);
            } finally {
              setLoading(false);
            }
          }}
          disabled={loading || row.Status !== 'approved'}
        >
          {loading ? 'Processing...' : 'Pass & Generate Finance Note'}
        </Button>
        <Button sx={{ flex: 1, fontWeight: 700, fontSize: "0.9rem", p: 1, borderRadius: 4, background: '#FF3B3F', color: '#fff',}}
  onClick={async () => {
    setLoading(true);
    try {
      const noteDataResponse = await expenditureService.getNoteData('RejectionNote', row.SNo);
      const noteData = noteDataResponse?.data;
      if (noteData) {
        // If data is present, map it to the reasons/remarks and generate the PDF
        const mappedReasons = [
          { reason: returnReasons[0], remark: noteData.MA || '' },
          { reason: returnReasons[1], remark: noteData.GSTR2A || '' },
          { reason: returnReasons[2], remark: noteData.CopyTaxIC || '' },
          { reason: returnReasons[3], remark: noteData.InvoiceMismatch || '' },
          { reason: returnReasons[4], remark: noteData.Refund || '' },
          { reason: returnReasons[5], remark: noteData.InvoiceCO6 || '' },
        ];
        await handleRejectAndGeneratePDF(mappedReasons);
      } else {
        // If no data, open the dialog to take inputs
        setOpenReturnModal(true);
      }
    } catch (err) {
      // On error, fallback to opening the dialog
      setOpenReturnModal(true);
    } finally {
      setLoading(false);
    }
  }}
  disabled={loading || row.Status !== 'rejected'}>
  {loading ? 'Processing...' : 'Reject & Generate Return Note'}
</Button>
        <Button sx={{ flex: 1, fontWeight: 700, fontSize: "0.9rem", p: 1, borderRadius: 4, background: '#6A5ACD', color: '#fff', }} onClick={() => setShowReviewCheck(true)}>Review & Update Observatons</Button>
      </Box>
      <Dialog open={openFinanceModal} onClose={() => setOpenFinanceModal(false)} PaperProps={{
  sx: {
    borderRadius: 4,
    background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
    boxShadow: 24,
    p: 0,
    minWidth: 400,
    maxWidth: 500,
  }
}}>
  <DialogTitle sx={{
    fontWeight: 700,
    fontSize: '1.3rem',
    color: '#222',
    background: 'rgba(0,0,0,0.04)',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    pb: 1.5,
    pt: 2,
    px: 3
  }}>
    Enter Finance Note Details
  </DialogTitle>
  <Divider sx={{ mb: 0, background: '#e0e0e0' }} />
  <DialogContent sx={{
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    background: 'rgba(255,255,255,0.85)',
    px: 3,
    py: 2,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16
  }}>
    <TextField
      label="Bill Passed Vide CO6 No."
      fullWidth
      margin="dense"
      variant="outlined"
      value={financeInputs.co6No}
      onChange={e => setFinanceInputs({ ...financeInputs, co6No: e.target.value })}
      sx={{ background: '#f7fafd', borderRadius: 2 }}
    />
    <TextField
      label="Liquidated Damages (L.D)"
      fullWidth
      margin="dense"
      variant="outlined"
      value={financeInputs.ld}
      onChange={e => setFinanceInputs({ ...financeInputs, ld: e.target.value })}
      sx={{ background: '#f7fafd', borderRadius: 2 }}
    />
    <TextField
      label="Other Deductions (if any)"
      fullWidth
      margin="dense"
      variant="outlined"
      value={financeInputs.otherDeductions}
      onChange={e => setFinanceInputs({ ...financeInputs, otherDeductions: e.target.value })}
      sx={{ background: '#f7fafd', borderRadius: 2 }}
    />
    <TextField
      label="Net Payment Recommended"
      fullWidth
      margin="dense"
      variant="outlined"
      value={financeInputs.netPayment}
      onChange={e => setFinanceInputs({ ...financeInputs, netPayment: e.target.value })}
      sx={{ background: '#f7fafd', borderRadius: 2 }}
    />
  </DialogContent>
  <DialogActions sx={{
    background: 'rgba(0,0,0,0.04)',
    px: 3,
    py: 2,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 2
  }}>
    <Button onClick={() => setOpenFinanceModal(false)} sx={{ color: '#555', fontWeight: 600, borderRadius: 2 }}>Cancel</Button>
    <Button
      onClick={async () => {
        setOpenFinanceModal(false);
        // Prepare the finance note data object
        const financeNoteData = {
          SNo: row.SNo,
          co6No: financeInputs.co6No,
          ld: financeInputs.ld,
          sd: null,
          otherDeductions: financeInputs.otherDeductions,
          netPayment: financeInputs.netPayment
        };
        // Send to backend
        try {
          await expenditureService.putNoteData(financeNoteData, 'FinanceNote');
        } catch (err) {
          console.error('Error saving finance note:', err);
        }
        // Then generate the PDF
        handlePassAndGenerate(financeInputs);
      }}
      variant="contained"
      sx={{
        background: 'linear-gradient(90deg, #00D1FF 0%, #00C49F 100%)',
        color: '#fff',
        fontWeight: 700,
        borderRadius: 2,
        px: 3,
        boxShadow: '0 2px 8px rgba(0,209,255,0.08)'
      }}
    >
      Generate
    </Button>
  </DialogActions>
</Dialog>
<Dialog open={openReturnModal} onClose={() => setOpenReturnModal(false)} PaperProps={{
  sx: {
    borderRadius: 4,
    background: 'linear-gradient(135deg, #fff1f0 0%, #f7d9d9 100%)',
    boxShadow: 24,
    p: 0,
    minWidth: 400,
    maxWidth: 500,
  }
}}>
  <DialogTitle sx={{
    fontWeight: 700,
    fontSize: '1.3rem',
    color: '#b71c1c',
    background: 'rgba(255,0,0,0.04)',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    pb: 1.5,
    pt: 2,
    px: 3
  }}>
    Enter Return Note Reasons
  </DialogTitle>
  <Divider sx={{ mb: 0, background: '#e0e0e0' }} />
  <DialogContent sx={{
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    background: 'rgba(255,255,255,0.85)',
    px: 3,
    py: 2,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16
  }}>
    {returnInputs.map((item, idx) => (
      <Box key={idx} sx={{ mb: 2 }}>
        <Typography variant="body2" sx={{ color: '#b71c1c', fontWeight: 500, mb: 0.5 }}>{item.reason}</Typography>
        <TextField
          placeholder="Enter remark"
          value={item.remark}
          onChange={e => handleReturnRemarkChange(idx, e.target.value)}
          fullWidth
          size="small"
          sx={{ background: '#fff', borderRadius: 2 }}
        />
      </Box>
    ))}
  </DialogContent>
  <DialogActions sx={{
    background: 'rgba(255,0,0,0.04)',
    px: 3,
    py: 2,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 2
  }}>
    <Button onClick={() => setOpenReturnModal(false)} sx={{ color: '#b71c1c', fontWeight: 600, borderRadius: 2 }}>Cancel</Button>
    <Button
      onClick={handleReturnModalSubmit}
      variant="contained"
      sx={{
        background: 'linear-gradient(90deg, #FF3B3F 0%, #FFBABA 100%)',
        color: '#fff',
        fontWeight: 700,
        borderRadius: 2,
        px: 3,
        boxShadow: '0 2px 8px rgba(255,59,63,0.08)'
      }}
    >
      Generate
    </Button>
  </DialogActions>
</Dialog>
    </Paper>
  );
};

export default Expanded;
