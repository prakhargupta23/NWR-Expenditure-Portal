import React, { useState } from 'react';
import { Box, Typography, Paper, Divider, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Checkbox, Select, MenuItem } from '@mui/material';
import { DocumentRow } from './expanded';
import { expenditureService } from "../services/expenditure.service";

interface ReviewCheckProps {
  row: DocumentRow;
  transparent?: boolean;
}

const parseRemarks = (remark: string) => {
  if (!remark) return [];
  // Split by newlines and filter out empty lines
  return remark.split(/\n|\r/).map(line => line.trim()).filter(line => line.length > 0);
};

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

const ReviewCheck: React.FC<ReviewCheckProps> = ({ row, transparent = false }) => {
  const { matched, unmatched } = parseMatchedUnmatched(row.Remark);
  // Combine unmatched first, then matched
  const allPoints = [
    ...unmatched.map(point => ({ point, status: 'Mismatch' as const })),
    ...matched.map(point => ({ point, status: 'Match' as const })),
  ];
  const [selected, setSelected] = useState<boolean[]>(Array(allPoints.length).fill(false));
  const [updateStatus, setUpdateStatus] = useState<string[]>(Array(allPoints.length).fill(''));
  const [localPoints, setLocalPoints] = useState(allPoints);
  const [localMatched, setLocalMatched] = useState(matched);
  const [localUnmatched, setLocalUnmatched] = useState(unmatched);
  const [localReviewers, setLocalReviewers] = useState(allPoints.map(({ point }) => extractReviewer(point).reviewer));
  const [localReviewTimes, setLocalReviewTimes] = useState(allPoints.map(({ point }) => extractReviewer(point).reviewTime));
  const [textInputs, setTextInputs] = useState<string[]>(Array(allPoints.length).fill(''));
  const [loading, setLoading] = useState(false);

  const handleCheckbox = (idx: number) => {
    setSelected(prev => prev.map((v, i) => (i === idx ? !v : v)));
  };
  const handleDropdown = (idx: number, value: string) => {
    setUpdateStatus(prev => prev.map((v, i) => (i === idx ? value : v)));
  };

  // Helper to extract reviewer, review time, and review remark from point text
  function extractReviewer(point: string): { text: string, reviewer: string, reviewTime: string, reviewRemark: string } {
    // Match pattern: ... (REVIEWEDBY (REVIEWTIME)(REMARK)) at the end
    const match = point.match(/^(.*)\(([^()]*)\s*\(([^()]*)\)\(([^()]*)\)\(([^()]*)\)\)$/);
    
    if (match) {
      return {
        text: match[1].trim(),
        reviewer: match[2].trim(),
        reviewTime: match[3].trim(),
        reviewRemark: match[4].trim(),
      };
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

  // Helper to rebuild remarks string
  function buildRemarks(matchedArr: string[], unmatchedArr: string[]) {
    let out = [];
    if (unmatchedArr.length > 0) {
      out.push('Unmatched Results');
      out.push(...unmatchedArr.map(p => `• ${p}`));
      out.push('');
    }
    if (matchedArr.length > 0) {
      out.push('Matched Results');
      out.push(...matchedArr.map(p => `• ${p}`));
    }
    return out.join('\n');
  }

  const handleUpdate = async () => {
    setLoading(true);
    let newMatched: string[] = [];
    let newUnmatched: string[] = [];
    const currentDateTime = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });

    localPoints.forEach(({ point, status }, idx) => {
      const { text, reviewer, reviewTime, reviewRemark } = extractReviewer(point);
      const sel = updateStatus[idx];
      // Only update review time if status or remark was changed
      const isUpdated = sel || textInputs[idx] !== '';
      const updatedRemark = textInputs[idx] !== '' ? textInputs[idx] : reviewRemark;
      const updatedReviewer = sel ? 'Manual' : reviewer;
      const updatedReviewTime = isUpdated ? currentDateTime : reviewTime;
      const rebuiltPoint = `${text} (${updatedReviewer} (${updatedReviewTime})(${updatedRemark})(-))`;
      if ((sel && sel === 'Match') || (!sel && status === 'Match')) {
        newMatched.push(rebuiltPoint);
      } else {
        newUnmatched.push(rebuiltPoint);
      }
    });
    // Rebuild remarks
    const newRemark = buildRemarks(newMatched, newUnmatched);
    const newStatus = newUnmatched.length === 0 ? "approved" : "rejected";
    const updatedRow = { ...row, Remark: newRemark, Status: newStatus };
    console.log("updating dbbbb",updatedRow);
    await expenditureService.updateExpenditureData(updatedRow);
    // Update GST invoice data for the same SNo
    try {
      const gstDataFetched = await expenditureService.getGstInvoiceData();
      const gstDataArray = gstDataFetched.data || gstDataFetched;
      const matchedGstData = gstDataArray.find((item: any) => String(item.SNo) === String(updatedRow.SNo));
      if (matchedGstData) {
        matchedGstData.Status = updatedRow.Status;
        matchedGstData.Remarks = updatedRow.Remark;
        console.log("dashboard report row udate",matchedGstData)
        await expenditureService.updateGstInvoiceData(matchedGstData);
      }
    } catch (err) {
      console.error('Error updating GST invoice data:', err);
    }
    
    // Update local state
    setLocalMatched(newMatched);
    setLocalUnmatched(newUnmatched);
    setLocalPoints([
      ...newUnmatched.map(point => ({ point, status: 'Mismatch' as const })),
      ...newMatched.map(point => ({ point, status: 'Match' as const })),
    ]);
    setUpdateStatus(Array(newMatched.length + newUnmatched.length).fill(''));
    setTextInputs(Array(newMatched.length + newUnmatched.length).fill(''));
    setLoading(false);
  };

  return (
    <Paper sx={{
      p: 3,
      borderRadius: 3,
      width: '90vw',
      maxWidth: '95%',
      mx: 'auto',
      background: 'rgba(0,0,0,0.2)',
      color: '#fff',
      boxShadow: transparent ? '0 4px 32px 0 rgba(31,38,135,0.12)' : undefined,
    }}>
      <Divider sx={{ mb: 2 }} />
      {allPoints.length === 0 ? (
        <Typography variant="body2" sx={{ color: '#444' }}>No review remarks available.</Typography>
      ) : (
        <>
          <TableContainer sx={{ maxHeight: 500, overflowY: 'auto', background: "rgba(0, 0, 0, 0.5)" }}>
            <Table stickyHeader>
                              <TableHead>
                  <TableRow>
                    {/* <TableCell sx={{ background: '#000', color: '#fff', textAlign: 'center', fontWeight: 700 }}>Select</TableCell> */}
                    <TableCell sx={{ background: '#000', color: '#fff', textAlign: 'center', fontWeight: 700 }}>Subject</TableCell>
                    <TableCell sx={{ background: '#000', color: '#fff', textAlign: 'center', fontWeight: 700 }}>Status</TableCell>
                    <TableCell sx={{ background: '#000', color: '#fff', textAlign: 'center', fontWeight: 700 }}>Reviewed By</TableCell>
                    <TableCell sx={{ background: '#000', color: '#fff', textAlign: 'center', fontWeight: 700 }}>Review Time</TableCell>
                    <TableCell sx={{ background: '#000', color: '#fff', textAlign: 'center', fontWeight: 700 }}>Update Status</TableCell>
                    <TableCell sx={{ background: '#000', color: '#fff', textAlign: 'center', fontWeight: 700 }}>Remarks</TableCell>
                  </TableRow>
                </TableHead>
              <TableBody>
                {localPoints.map(({ point, status }, idx) => {
                  const { text, reviewer, reviewTime, reviewRemark } = extractReviewer(point);
                  return (
                    <TableRow key={idx}>
                      <TableCell sx={{ color: '#fff', textAlign: 'left' }}>{text}</TableCell>
                      <TableCell sx={{ color: status === 'Match' ? '#4caf50' : '#f44336', textAlign: 'center', fontWeight: 700 }}>{status}</TableCell>
                      <TableCell sx={{ color: '#fff', textAlign: 'center', fontWeight: 700 }}>{reviewer}</TableCell>
                      <TableCell sx={{ color: '#fff', textAlign: 'center', fontWeight: 700 }}>{updateStatus[idx] ? new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }) : reviewTime}</TableCell>
                      <TableCell sx={{ textAlign: 'center' }}>
                        <Select
                          value={updateStatus[idx]}
                          displayEmpty
                          onChange={e => handleDropdown(idx, e.target.value as string)}
                          size="small"
                          sx={{ minWidth: 100, background: '#fff', color: '#222', borderRadius: 1 }}
                        >
                          <MenuItem value="">Select</MenuItem>
                          <MenuItem value="Match">Match</MenuItem>
                          <MenuItem value="Mismatch">Mismatch</MenuItem>
                        </Select>
                      </TableCell>
                      <TableCell sx={{ textAlign: 'center' }}>
                        <input
                          type="text"
                          value={textInputs[idx] !== '' ? textInputs[idx] : reviewRemark}
                          onChange={e => {
                            const newInputs = [...textInputs];
                            newInputs[idx] = e.target.value;
                            setTextInputs(newInputs);
                          }}
                          style={{ width: '200px', height: '30px', padding: '4px', borderRadius: '4px', border: '1px solid #ccc' }}
                          placeholder="Add remarks"
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
            <button
              style={{
                background: '#1976d2',
                color: '#fff',
                fontWeight: 700,
                fontSize: '1rem',
                padding: '12px 32px',
                borderRadius: '8px',
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: '0 2px 8px rgba(25, 118, 210, 0.15)',
                opacity: loading ? 0.7 : 1,
              }}
              disabled={loading}
              onClick={handleUpdate}
            >
              {loading ? 'Updating...' : 'Update Observations'}
            </button>
          </Box>
        </>
      )}
    </Paper>
  );
};

export default ReviewCheck; 