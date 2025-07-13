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
  const [loading, setLoading] = useState(false);

  const handleCheckbox = (idx: number) => {
    setSelected(prev => prev.map((v, i) => (i === idx ? !v : v)));
  };
  const handleDropdown = (idx: number, value: string) => {
    setUpdateStatus(prev => prev.map((v, i) => (i === idx ? value : v)));
  };

  // Helper to extract reviewer and review time from point text
  function extractReviewer(point: string): { text: string, reviewer: string, reviewTime: string } {
    console.log(point)
    //const match = point.match(/^(.*?)\s*\(([^)]+)\)\s*$/);
    const match = point.match(/^(.*?)\s*\(([^()\s]+)\s*\(([^()]+)\)\)$/);
    console.log("ghj",match)
    if (match) {
      const remarkText = match[1].trim();
      const reviewerPart = match[2].trim();
      console.log(remarkText)
      console.log(reviewerPart)
      // Check if reviewer part contains date/time info like "AI (29/05/2025)"
      // const timeMatch = reviewerPart.match(/^(.+?)\s*\(([^)]+)\)$/);
      const timeMatch = match[3].trim();
      console.log("time watch",timeMatch)
      // if (timeMatch) {
      //   return { 
      //     text: remarkText, 
      //     reviewer: timeMatch[1].trim(), 
      //     reviewTime: timeMatch[2].trim() 
      //   };
      // }
      return { text: remarkText, reviewer: reviewerPart, reviewTime: timeMatch };
    }
    console.log("dhcaskj")
    return { text: point, reviewer: '-', reviewTime: '-' };
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
    // Copy current points and reviewers
    let newMatched: string[] = [...localMatched];
    let newUnmatched: string[] = [...localUnmatched];
    let newReviewers: string[] = [...localReviewers];
    let newReviewTimes: string[] = [...localReviewTimes];
    const currentDateTime = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });
    
    // For each point, if updateStatus is set, update reviewer and move point
    localPoints.forEach(({ point, status }, idx) => {
      const { text } = extractReviewer(point);
      const sel = updateStatus[idx];
      if (sel === 'Match' || sel === 'Mismatch') {
        // Remove from both arrays if present
        newMatched = newMatched.filter(p => extractReviewer(p).text !== text);
        newUnmatched = newUnmatched.filter(p => extractReviewer(p).text !== text);
        // Add to correct array with reviewer 'Manual' and current date/time
        const newPoint = `${text} (Manual (${currentDateTime}))`;
        if (sel === 'Match') newMatched.push(newPoint);
        else newUnmatched.push(newPoint);
        newReviewers[idx] = 'Manual';
        newReviewTimes[idx] = currentDateTime;
      }
    });
    // Rebuild remarks
    const newRemark = buildRemarks(newMatched, newUnmatched);
    // Update row and backend
    const updatedRow = { ...row, Remark: newRemark };
    console.log('remark',updatedRow)
    await expenditureService.updateExpenditureData(updatedRow);
    // Update local state
    setLocalMatched(newMatched);
    setLocalUnmatched(newUnmatched);
    setLocalPoints([
      ...newUnmatched.map(point => ({ point, status: 'Mismatch' as const })),
      ...newMatched.map(point => ({ point, status: 'Match' as const })),
    ]);
    setLocalReviewers([
      ...newUnmatched.map(() => 'Manual'),
      ...newMatched.map(() => 'Manual'),
    ]);
    setLocalReviewTimes([
      ...newUnmatched.map(() => currentDateTime),
      ...newMatched.map(() => currentDateTime),
    ]);
    setUpdateStatus(Array(newMatched.length + newUnmatched.length).fill(''));
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
                  </TableRow>
                </TableHead>
              <TableBody>
                {localPoints.map(({ point, status }, idx) => {
                  const { text, reviewer, reviewTime } = extractReviewer(point);
                  return (
                    <TableRow key={idx}>
                      <TableCell sx={{ color: '#fff', textAlign: 'left' }}>{text}</TableCell>
                      <TableCell sx={{ color: status === 'Match' ? '#4caf50' : '#f44336', textAlign: 'center', fontWeight: 700 }}>{status}</TableCell>
                      <TableCell sx={{ color: '#fff', textAlign: 'center', fontWeight: 700 }}>{updateStatus[idx] ? 'Manual' : reviewer}</TableCell>
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