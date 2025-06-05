import React, { useMemo } from "react";
import {
  TableContainer,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Typography,
  Box,
  CircularProgress,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { ArrowDownward, ArrowUpward } from "@mui/icons-material";

interface DataRecord {
  division: string;
  actualThisMonth: number;
  targetThisMonth: number;
}

interface SummaryRecord extends DataRecord {
  percentage: number;
  status: boolean;
}

interface DivisionPerformanceTableProps {
  data: DataRecord[];
  dataLoading: boolean;
  categoryType: string;
}

const formatCurrency = (value: number) =>
  `₹${value.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

const LeaderBoard: React.FC<DivisionPerformanceTableProps> = ({
  data,
  dataLoading,
  categoryType,
}) => {
  const theme = useTheme();

  const summary = useMemo<SummaryRecord[]>(() => {
    const grouped: Record<string, { actual: number; target: number }> = {};

    data.forEach(({ division, actualThisMonth, targetThisMonth }) => {
      grouped[division] ??= { actual: 0, target: 0 };
      grouped[division].actual += actualThisMonth;
      grouped[division].target += targetThisMonth;
    });

    return Object.entries(grouped)
      .map(([division, { actual, target }]) => {
        const diff = target ? ((actual - target) / target) * 100 : 0;
        const percentage = parseFloat(diff.toFixed(2));
        return {
          division,
          actualThisMonth: actual,
          targetThisMonth: target,
          percentage,
          status: diff >= 0,
        };
      })
      .sort((a, b) => b.percentage - a.percentage);
  }, [data]);

  const renderPerformanceInfo = (row: SummaryRecord) => {
    const isExpenditure = categoryType === "Expenditure";
    const absPercent = Math.abs(row.percentage).toLocaleString("en-IN", {
      maximumFractionDigits: 2,
    });

    const color =
      row.percentage >= 0
        ? row.percentage > 10 || !isExpenditure
          ? theme.palette.error.main
          : theme.palette.success.main
        : Math.abs(row.percentage) > 5 || !isExpenditure
        ? theme.palette.error.main
        : theme.palette.success.main;

    const Icon = row.percentage >= 0 ? ArrowUpward : ArrowDownward;

    return (
      <>
        <Typography component="span" sx={{ color: "white", fontSize: 12 }}>
          {categoryType} is {row.percentage >= 0 ? "above" : "below"} target by{" "}
        </Typography>
        <Typography
          component="span"
          sx={{ color, fontWeight: 600, ml: 0.5, fontSize: 12 }}
        >
          {absPercent}%
        </Typography>
        <Icon sx={{ color, ml: 0.5, fontSize: 16 }} />
      </>
    );
  };

  return (
    <TableContainer
      component={Paper}
      sx={{
        background: "rgba(56, 38, 96, 0.9)",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        borderRadius: 2,
        border: "1px solid #B72BF8",
        boxSizing: "border-box",
        overflow: "hidden",
      }}
    >
      {/* Static Header */}
      <Box sx={{ py: 2, borderBottom: "1px solid rgba(255,255,255,0.2)" }}>
        <Typography variant="h6" sx={{ color: "white", textAlign: "center" }}>
          Leader Board
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: "white",
            textAlign: "center",
            fontSize: "0.875rem",
            marginTop: 1,
          }}
        >
          Figures in thousands
        </Typography>
      </Box>

      {/* Scrollable Table Area */}
      {dataLoading ? (
        <Box
          sx={{
            flex: 1,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <CircularProgress sx={{ color: "white" }} />
        </Box>
      ) : (
        <Box sx={{ flex: 1, overflowY: "auto" }}>
          <Table size="small" sx={{ minWidth: 300, width: "100%" }}>
            <TableHead>
              <TableRow sx={{ backgroundColor: "rgba(255,255,255,0.05)" }}>
                <TableCell sx={{ color: "white", fontWeight: 600 }}>
                  Division
                </TableCell>
                <TableCell
                  align="right"
                  sx={{ color: "white", fontWeight: 600 }}
                >
                  Actual
                </TableCell>
                <TableCell
                  align="right"
                  sx={{ color: "white", fontWeight: 600 }}
                >
                  Target
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {summary.map((row, idx) => (
                <React.Fragment key={row.division}>
                  <TableRow
                    sx={{
                      backgroundColor:
                        idx % 2 === 0
                          ? "rgba(255,255,255,0.02)"
                          : "transparent",
                    }}
                  >
                    <TableCell sx={{ color: "white" }}>
                      {row.division}
                    </TableCell>
                    <TableCell align="right" sx={{ color: "white" }}>
                      {formatCurrency(row.actualThisMonth)}
                    </TableCell>
                    <TableCell align="right" sx={{ color: "white" }}>
                      {formatCurrency(row.targetThisMonth)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell colSpan={3} sx={{ py: 1 }}>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                          flexWrap: "wrap",
                          textAlign: "center",
                          fontSize: "0.875rem",
                        }}
                      >
                        {renderPerformanceInfo(row)}
                      </Box>
                    </TableCell>
                  </TableRow>
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </Box>
      )}
    </TableContainer>
  );
};

export default LeaderBoard;
