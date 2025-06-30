import React, { useEffect, useState } from "react";
import { Box, Paper, Typography, CircularProgress, Collapse, IconButton } from "@mui/material";
import { expenditureService } from "../services/expenditure.service";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';

interface ReviewRow {
  SNo: number;
  AuthorizationCommittee: string | null;
  Status: string;
  VerificationTime?: string | null;
  Remark?: string | null;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "approved":
      return "#4CAF50";
    case "rejected":
      return "#F44336";
    case "pending":
    default:
      return "#FFC107";
  }
};

const formatRemarks = (remark: string | null | undefined) => {
  if (!remark || !remark.trim()) return <Typography sx={{ fontStyle: 'italic', color: '#aaa' }}>No remarks</Typography>;
  // Split by newlines, remove empty lines
  const lines = remark.split(/\r?\n/).filter(line => line.trim() !== "");
  return (
    <Box component="ul" sx={{ pl: 3, mb: 0 }}>
      {lines.map((line, idx) => (
        <li key={idx} style={{ marginBottom: 4, whiteSpace: 'pre-line' }}>{line}</li>
      ))}
    </Box>
  );
};

const Review: React.FC = () => {
  const [rows, setRows] = useState<ReviewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<{ [key: number]: boolean }>({});

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await expenditureService.getExpenditureData();
        setRows(res.data || []);
      } catch (e) {
        setRows([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleRowDoubleClick = (sno: number) => {
    setExpanded(prev => ({ ...prev, [sno]: !prev[sno] }));
  };

  return (
    <Box sx={{ width: '100%', maxWidth: 1300, mx: 'auto', mt: 0 }}>
      <Typography variant="h5" sx={{ color: 'white', mb: 2, mt: 27, fontWeight: 600 }}>Review Check</Typography>
      <Paper sx={{
        flex: 1,
        borderRadius: '12px',
        backgroundColor: '#161921',
        border: '1px solid rgba(251, 249, 252, 0.2)',
        overflow: 'auto',
        boxShadow: 3,
        '&::-webkit-scrollbar': {
          width: '6px',
          height: '6px',
        },
        '&::-webkit-scrollbar-track': {
          background: '#161921',
        },
        '&::-webkit-scrollbar-thumb': {
          background: '#7B2FF7',
          borderRadius: '3px',
        },
        p: 2,
      }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
            <CircularProgress />
          </Box>
        ) : rows.length === 0 ? (
          <Typography sx={{ color: '#aaa', textAlign: 'center', py: 4 }}>No data found.</Typography>
        ) : (
          <Box sx={{ fontSize: '1.2rem' }}>
            <Box sx={{ display: 'flex', fontWeight: 700, color: 'white', borderBottom: '1px solid #333', pb: 2, mb: 2, position: 'sticky', top: 0, zIndex: 1, background: '#181b23', fontSize: '1em' }}>
              <Box sx={{ flex: 1, textAlign: 'center' }}>IREPS Bill No</Box>
              <Box sx={{ flex: 1, textAlign: 'center' }}>Status</Box>
              <Box sx={{ flex: 1, textAlign: 'center' }}>Verified At</Box>
              <Box sx={{ flex: 1, textAlign: 'center' }}></Box>
            </Box>
            <Box sx={{ maxHeight: 500, overflowY: 'auto', pr: 1 }}>
              {rows.map(row => (
                <Box key={row.SNo}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      background: '#23263a',
                      borderRadius: 2,
                      mb: 1,
                      cursor: 'pointer',
                      transition: 'background 0.2s',
                      '&:hover': { background: '#2d3147' },
                      color: 'white',
                      fontWeight: 500,
                      py: 1.1,
                      px: 2,
                      fontSize: '0.92em',
                    }}
                    onClick={() => handleRowDoubleClick(row.SNo)}
                  >
                    <Box sx={{ flex: 1, textAlign: 'center', display: 'flex', justifyContent: 'center' }}>{row.AuthorizationCommittee || '-'}</Box>
                    <Box sx={{ flex: 1, textAlign: 'center', display: 'flex', justifyContent: 'center', color: getStatusColor(row.Status), fontWeight: 700 }}>{row.Status.charAt(0).toUpperCase() + row.Status.slice(1)}</Box>
                    <Box sx={{ flex: 1, textAlign: 'center', display: 'flex', justifyContent: 'right' }}>{row.VerificationTime || ''}</Box>
                    <Box sx={{ flex: 1, textAlign: 'center', display: 'flex', justifyContent: 'right' }}>
                      <IconButton
                        onClick={e => { e.stopPropagation(); handleRowDoubleClick(row.SNo); }}
                        size="small"
                        sx={{ color: 'white' }}
                      >
                        {expanded[row.SNo] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                      </IconButton>
                    </Box>
                  </Box>
                  <Collapse in={!!expanded[row.SNo]} timeout="auto" unmountOnExit>
                    <Box sx={{ background: '#23263a', borderRadius: 2, mt: -1, mb: 1, px: 4, py: 2, color: 'white', fontSize: '0.92em' }}>
                      <Typography sx={{ fontWeight: 600, mb: 1, fontSize: '1em' }}>Remarks:</Typography>
                      {formatRemarks(row.Remark)}
                    </Box>
                  </Collapse>
                </Box>
              ))}
            </Box>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default Review; 