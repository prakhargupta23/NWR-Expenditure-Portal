import React, { useState } from 'react';
import { Box, Typography, Paper, Divider, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Checkbox, Select, MenuItem } from '@mui/material';
import { DocumentRow } from './expanded';

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
    ...unmatched.map(point => ({ point, status: 'unmatched' as const })),
    ...matched.map(point => ({ point, status: 'matched' as const })),
  ];
  const [selected, setSelected] = useState<boolean[]>(Array(allPoints.length).fill(false));
  const [updateStatus, setUpdateStatus] = useState<string[]>(Array(allPoints.length).fill('Pending'));

  const handleCheckbox = (idx: number) => {
    setSelected(prev => prev.map((v, i) => (i === idx ? !v : v)));
  };
  const handleDropdown = (idx: number, value: string) => {
    setUpdateStatus(prev => prev.map((v, i) => (i === idx ? value : v)));
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
          <TableContainer sx={{ maxHeight: 350, overflowY: 'auto', background: "rgba(0, 0, 0, 0.5)" }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ background: '#000', color: '#fff', textAlign: 'center', fontWeight: 700 }}>Select</TableCell>
                  <TableCell sx={{ background: '#000', color: '#fff', textAlign: 'center', fontWeight: 700 }}>Subject</TableCell>
                  <TableCell sx={{ background: '#000', color: '#fff', textAlign: 'center', fontWeight: 700 }}>Status</TableCell>
                  <TableCell sx={{ background: '#000', color: '#fff', textAlign: 'center', fontWeight: 700 }}>Update Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {allPoints.map(({ point, status }, idx) => (
                  <TableRow key={idx}>
                    <TableCell sx={{ textAlign: 'center', }}>
                      <Checkbox checked={selected[idx]} onChange={() => handleCheckbox(idx)} />
                    </TableCell>
                    <TableCell sx={{ color: '#fff', textAlign: 'center' }}>{point}</TableCell>
                    <TableCell sx={{ color: status === 'matched' ? '#4caf50' : '#f44336', textAlign: 'center', fontWeight: 700 }}>{status}</TableCell>
                    <TableCell sx={{ textAlign: 'center' }}>
                      <Select
                        value={updateStatus[idx]}
                        onChange={e => handleDropdown(idx, e.target.value as string)}
                        size="small"
                        sx={{ minWidth: 120, background: '#fff', color: '#222', borderRadius: 1 }}
                      >
                        <MenuItem value="Pending">Pending</MenuItem>
                        <MenuItem value="Resolved">Resolved</MenuItem>
                        <MenuItem value="Escalated">Escalated</MenuItem>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
            <button style={{
              background: '#1976d2',
              color: '#fff',
              fontWeight: 700,
              fontSize: '1rem',
              padding: '12px 32px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(25, 118, 210, 0.15)'
            }}>
              Update Observations
            </button>
          </Box>
        </>
      )}
    </Paper>
  );
};

export default ReviewCheck; 