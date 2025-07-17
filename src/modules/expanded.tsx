import React, { useState } from "react";
import { Box, Typography, Button, Divider, Grid, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from "@mui/material";
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

  // Helper to extract reviewer, review time, and review remark from point text
  function extractReviewer(point: string): { text: string, reviewer: string, reviewTime: string, reviewRemark: string } {
    // Match pattern: ... (REVIEWEDBY (REVIEWTIME)(REMARK)) at the end
    // const match = point.match(/^(.*)\(([^()]*)\s*\(([^()]*)\)\(([^()]*)\)\(([^()]*)\)\)\)$/);
    const match = point.match(/^(.*)\(([^()]+)\s*\(([^()]*)\)\s*\(([^()]*)\)\s*\(([^()]*)\)\)$/);
    console.log("daasdfghj",match)
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

  const handlePassAndGenerate = async () => {
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
        { no: '3.', detail: 'Bill Passed Vide CO6 No.', key: '' },
        { no: '4.', detail: 'Invoice Number & Date', key: '' },
        { no: '5.', detail: 'Receipt Note Number', key: 'RNoteNo' },
        { no: '6.', detail: 'Material Received On', key: '' },
        { no: '7.', detail: 'Quantity Accepted', key: 'QtyAccepted' },
        { no: '8.', detail: 'Liquidated Damages (L.D) ', key: '' },
        { no: '9.', detail: 'Security Deposit (S.D) ', key: 'Security' },
        { no: '10.', detail: 'Other Deductions (if any) ', key: '' },
        { no: '11.', detail: 'Net Payment Recommended ', key: 'TotalAmt' },
      ];
      doc.setFont('helvetica', 'normal');
      tableRows.forEach((row, idx) => {
        let remarks = '';
        if (row.key && matchedGstData && matchedGstData[row.key] != null) {
          if (row.detail === 'Invoice Number & Date') {
            remarks = `${matchedGstData['InvoiceNo'] || ''} ${matchedGstData['InvoiceDate'] || ''}`.trim();
          } else {
            remarks = String(matchedGstData[row.key]);
          }
        } else if (row.detail === 'Invoice Number & Date' && matchedGstData) {
          remarks = `${matchedGstData['InvoiceNo'] || ''} ${matchedGstData['InvoiceDate'] || ''}`.trim();
        }
        doc.text(row.no, leftPad + 2, y);
        doc.text(row.detail, leftPad + 28, y);
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
    setLoading(true);
    try {
      // Fetch all GST invoice data
      const gstDataFetched = await expenditureService.getGstInvoiceData();
      const gstDataArray = gstDataFetched.data;
      // Find the GST data object matching the current row's SNo
      const matchedGstData = gstDataArray.find((item: any) => String(item.SNo) === String(row.SNo));
      let unmatchedResults: string[] = [];
      if (matchedGstData && matchedGstData.Remarks) {
        try {
          const remarksObj = JSON.parse(matchedGstData.Remarks);
          if (Array.isArray(remarksObj.UnmatchedResults)) {
            unmatchedResults = remarksObj.UnmatchedResults;
          }
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
      // Bullet points section with subtle background
      doc.setFillColor(245, 245, 245);
      doc.rect(leftPad - 4, y - 2, 165, 8 * Math.max(1, unmatchedResults.length), 'F');
      const lineHeight = 6;
      if (unmatchedResults.length > 0) {
        unmatchedResults.forEach((point, idx) => {
          const { text } = extractReviewer(point);
          const lines = doc.splitTextToSize(`${idx + 1}. ${text}`, 160);
          lines.forEach((line: string) => {
            if (y > 270) { doc.addPage(); y = 25; }
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(11);
            doc.text(line, leftPad, y);
            y += lineHeight;
          });
        });
      } else {
        doc.text('No specific remarks found.', leftPad, y);
        y += 8;
      }
      y += 6;
      // Action Required section with highlight
      doc.setFillColor(255, 255, 255);
      doc.rect(leftPad - 4, y - 2, 165, 14, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(0, 51, 153);
      doc.text('Action Required:', leftPad, y + 7);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.setTextColor(0, 0, 0);
      y += 12;
      doc.text('Please rectify the above points and resubmit for bill passing.', leftPad, y);
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
