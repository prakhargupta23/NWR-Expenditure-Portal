import React, { useEffect, useState } from "react";
import {
  Grid,
  Paper,
  Typography,
  Select,
  MenuItem,
  Checkbox,
  ListItemText,
  CircularProgress,
  Box,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
} from "@mui/material";
import { formatHeader, getMonthYear } from "../../utils/otherUtils";
import { divisions, months, years } from "../../utils/staticDataUtis";
import { transactionService } from "../../services/transaction.service";

interface SheetResponse {
  sheetName: string;
  data: Record<string, any>[];
  comment: { [key: string]: any } | null;
}

function SheetTable({ sheetName }: any) {
  // state for filters
  const [division, setDivision] = useState<string>("Jaipur");
  const [selectedDate, setSelectedDate] = useState({
    month: "January",
    year: new Date().getFullYear().toString(),
  });

  // state for fetched data
  const [dataLoading, setDataLoading] = useState(false);
  const [sheetData, setSheetData] = useState<SheetResponse[]>([]);

  // handlers
  const handleDivisionChange = (event: any) => {
    const {
      target: { value },
    } = event;
    setDivision(typeof value === "string" ? value.split(",") : value);
  };

  const handleDateChange = (field: "month" | "year") => (e: any) => {
    setSelectedDate((prev) => ({
      ...prev,
      [field]: e.target.value,
    }));
  };

  // fetch on any filter change
  useEffect(() => {
    const fetchData = async () => {
      setDataLoading(true);
      const newDate = getMonthYear(selectedDate.month, selectedDate.year);
      try {
        const response = await transactionService.getTransactionDocData(
          division,
          newDate,
          sheetName
        );

        if (response.success) {
          setSheetData([response?.data[0]]);
        } else {
          alert("Some error has happened");
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setSheetData([]);
      } finally {
        setDataLoading(false);
      }
    };

    fetchData();
  }, [division, selectedDate, sheetName]);


  return (
    <>
      <Box
        sx={{
          width: "95%",
          paddingTop: "2%",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {/* Filters Row */}
        <Grid container spacing={2} alignItems="center">
          {/* Month */}
          <Grid
            item
            xs={12}
            sm={12}
            md={12}
            lg={4}
            sx={{ display: "flex", justifyContent: "center" }}
          >
            <Select
              value={selectedDate.month}
              onChange={(e) =>
                setSelectedDate((prev: any) => ({
                  ...prev,
                  month: e.target.value, // Assuming 'year' is the field to update
                }))
              }
              displayEmpty
              fullWidth
              sx={{
                backgroundColor: "#222633",
                borderRadius: "10px",
                height: "40px",
                maxWidth: "180px",
                minWidth: "150px",

                fontWeight: "600",
                color: "#fff",
                justifyContent: "space-between",
                display: "flex",
                alignItems: "center",

                border: "1px solid rgba(255, 255, 255, 0.2)", // Add subtle border
                fontFamily: "MyCustomFont,SourceSerif4_18pt",
                "& .MuiSelect-icon": {
                  color: "#fff",
                },
              }}
            >
              {months.map((month, index) => (
                <MenuItem key={index} value={month}>
                  {month}
                </MenuItem>
              ))}
            </Select>
          </Grid>

          {/* Year */}
          <Grid
            item
            xs={12}
            sm={12}
            md={12}
            lg={4}
            sx={{ display: "flex", justifyContent: "center" }}
          >
            <Select
              value={selectedDate.year}
              onChange={(e) =>
                setSelectedDate((prev: any) => ({
                  ...prev,
                  year: e.target.value, // Assuming 'year' is the field to update
                }))
              }
              displayEmpty
              fullWidth
              sx={{
                backgroundColor: "#222633",
                borderRadius: "10px",
                height: "40px",
                maxWidth: "180px",
                minWidth: "150px",

                fontWeight: "600",
                color: "#fff",
                justifyContent: "space-between",
                display: "flex",
                alignItems: "center",

                border: "1px solid rgba(255, 255, 255, 0.2)", // Add subtle border
                "& .MuiSelect-icon": {
                  color: "#fff",
                },
              }}
            >
              {years.map((year) => (
                <MenuItem key={year} value={year}>
                  {year}
                </MenuItem>
              ))}
            </Select>
          </Grid>

          {/* Division */}
          <Grid item xs={12} sm={6} md={3} lg={4}>
            <Select
              fullWidth
              value={division}
              onChange={handleDivisionChange}
              sx={{
                backgroundColor: "#222633",
                color: "#fff",
                borderRadius: "8px",
              }}
              MenuProps={{
                PaperProps: {
                  sx: { bgcolor: "#282828", color: "#fff" },
                },
              }}
            >
              {divisions.map((d, index) => (
                <MenuItem key={index} value={d.name}>
                  {d.name}
                </MenuItem>
              ))}
            </Select>
          </Grid>
        </Grid>
      </Box>

      {/* Data Table or Loading */}
      {dataLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
          <CircularProgress style={{ color: "white" }} />
        </Box>
      ) : sheetData?.length > 0 ? (
        sheetData.map(({ sheetName, data, comment }) => {
          console.log('Mapping sheet data - Sheet name:', sheetName);
          console.log('Mapping sheet data - Raw data:', data);
          console.log('Sheet name comparison:', {
            received: sheetName,
            expected: 'Audit Objection',
            isMatch: sheetName === 'Audit Objection'
          });
          
          // Sort data by yearOfReport in ascending order if it's HQ Inspection table
          const sortedData = sheetName === 'Hrinspection' 
            ? [...data].sort((a, b) => {
                const yearA = parseInt(a.yearOfReport) || 0;
                const yearB = parseInt(b.yearOfReport) || 0;
                return yearA - yearB;
              })
            : data;

          console.log('Sorted data:', sortedData);

          return (
            <Box key={sheetName} sx={{ mt: 4, width: "95%", mx: "auto" }}>
              <Box
                sx={{
                  width: "100%",
                  overflowX: "auto",
                  overflowY: "auto",
                  maxHeight: 440,
                  backgroundColor: "#2c2c2c",
                  borderRadius: 2,
                  boxShadow: 3,
                }}
              >
                <Table size="small" stickyHeader sx={{ minWidth: 800 }}>
                  <TableHead>
                    <TableRow>
                      {sortedData.length > 0 && (
                        (() => {
                          if (sheetName === 'Auditobjection' || sheetName === 'Audit Objection') {
                            const columns = [
                              'suspense heads',
                              'Position Lhy',
                              'opening balance',
                              'accretion',
                              'clearence over one year',
                              'clearence less than one year',
                              'total clearence',
                              'closing balance'
                            ];
                            return columns;
                          } else if (sheetName === 'Accountinspection' || sheetName === 'Account Inspection') {
                            const columns = [
                              'type of report',
                              'Position Lhy',
                              'opening balance',
                              'accretion',
                              'clearence over one year',
                              'clearence less than one year',
                              'total clearence',
                              'closing balance'
                            ];
                            return columns;
                          } else if (sheetName === 'Dwrecoverable' || sheetName === 'DW Recoverable') {
                            const columns = [
                              'department',
                              'type',
                              'opening balance item',
                              'opening balance',
                              'accretion up to month item',
                              'accretion up to month',
                              'clearence up to month item',
                              'clearence up to month',
                              'closing balance item',
                              'closing balance'
                            ];
                            return columns;
                          } else if (sheetName === 'Stocksheet' || sheetName === 'Stock Sheet') {
                            const columns = [
                              'department',
                              'opening balance as last year month',
                              'accretion up to month',
                              'clearence up to month',
                              'total',
                              'closing balance',
                              'remarks'
                            ];
                            return columns;
                          } else if (sheetName === 'Suspenseregister' || sheetName === 'Suspense Register') {
                            const columns = [
                              'suspense heads',
                              'position item',
                              'position',
                              'position lhr item',
                              'position lhr',
                              'closing balance item',
                              'closing balance',
                              'reconcilation month'
                            ];
                            return columns;
                          }
                          return Object.keys(sortedData[0]);
                        })().map((col) => (
                          <TableCell
                            key={col}
                            sx={{
                              color: "#ffffff",
                              backgroundColor: "#333",
                              fontWeight: 600,
                              whiteSpace: "nowrap",
                              borderBottom: "1px solid #555",
                              position: "sticky",
                              top: 0,
                              zIndex: 2,
                            }}
                          >
                            {formatHeader(col)}
                          </TableCell>
                        ))
                      )}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {sortedData.map((row, ri) => (
                      <TableRow key={ri} hover>
                        {(() => {
                          if (sheetName === 'Auditobjection' || sheetName === 'Audit Objection') {
                            const columns = [
                              'suspense heads',
                              'Position Lhy',
                              'opening balance',
                              'accretion',
                              'clearence over one year',
                              'clearence less than one year',
                              'total clearence',
                              'closing balance'
                            ];
                            
                            return columns.map((col, ci) => {
                              let value = '-';
                              
                              if (col === 'total clearence') {
                                const overOneYear = parseFloat(row['clearenceOverOneYear'] || '0');
                                const lessThanOneYear = parseFloat(row['clearenceLessOneYear'] || '0');
                                value = (overOneYear + lessThanOneYear).toString();
                              } else if (col === 'Position Lhy') {
                                value = row['positionLhr']?.toString() || '-';
                              } else if (col === 'suspense heads') {
                                value = row['suspenseHeads']?.toString() || '-';
                              } else if (col === 'opening balance') {
                                value = row['openingBalance']?.toString() || '-';
                              } else if (col === 'accretion') {
                                value = row['accretion']?.toString() || '-';
                              } else if (col === 'clearence over one year') {
                                value = row['clearenceOverOneYear']?.toString() || '-';
                              } else if (col === 'clearence less than one year') {
                                value = row['clearenceLessOneYear']?.toString() || '-';
                              } else if (col === 'closing balance') {
                                value = row['closingBalance']?.toString() || '-';
                              }
                              
                              return (
                                <TableCell
                                  key={ci}
                                  sx={{
                                    color: "#e0e0e0",
                                    whiteSpace: "nowrap",
                                    borderBottom: "1px solid #444",
                                  }}
                                >
                                  {value}
                                </TableCell>
                              );
                            });
                          } else if (sheetName === 'Accountinspection' || sheetName === 'Account Inspection') {
                            const columns = [
                              'type of report',
                              'Position Lhy',
                              'opening balance',
                              'accretion',
                              'clearence over one year',
                              'clearence less than one year',
                              'total clearence',
                              'closing balance'
                            ];
                            
                            return columns.map((col, ci) => {
                              let value = '-';
                              
                              if (col === 'total clearence') {
                                const overOneYear = parseFloat(row['clearanceOverOneYear'] || '0');
                                const lessThanOneYear = parseFloat(row['clearanceLessThanOneYear'] || '0');
                                value = (overOneYear + lessThanOneYear).toString();
                              } else if (col === 'Position Lhy') {
                                value = row['positionLhr']?.toString() || '-';
                              } else if (col === 'type of report') {
                                value = row['typeOfReport']?.toString() || '-';
                              } else if (col === 'opening balance') {
                                value = row['openingBalance']?.toString() || '-';
                              } else if (col === 'accretion') {
                                value = row['accretion']?.toString() || '-';
                              } else if (col === 'clearence over one year') {
                                value = row['clearanceOverOneYear']?.toString() || '-';
                              } else if (col === 'clearence less than one year') {
                                value = row['clearanceLessThanOneYear']?.toString() || '-';
                              } else if (col === 'closing balance') {
                                value = row['closingBalance']?.toString() || '-';
                              }
                              
                              return (
                                <TableCell
                                  key={ci}
                                  sx={{
                                    color: "#e0e0e0",
                                    whiteSpace: "nowrap",
                                    borderBottom: "1px solid #444",
                                  }}
                                >
                                  {value}
                                </TableCell>
                              );
                            });
                          } else if (sheetName === 'Dwrecoverable' || sheetName === 'DW Recoverable') {
                            const columns = [
                              'department',
                              'type',
                              'opening balance item',
                              'opening balance',
                              'accretion up to month item',
                              'accretion up to month',
                              'clearence up to month item',
                              'clearence up to month',
                              'closing balance item',
                              'closing balance'
                            ];
                            
                            return columns.map((col, ci) => {
                              let value = '-';
                              
                              if (col === 'department') {
                                value = row['department']?.toString() || '-';
                              } else if (col === 'type') {
                                value = row['type']?.toString() || '-';
                              } else if (col === 'opening balance item') {
                                value = row['openingBalanceItem']?.toString() || '-';
                              } else if (col === 'opening balance') {
                                value = row['openingBalance']?.toString() || '-';
                              } else if (col === 'accretion up to month item') {
                                value = row['accretionUptoTheMonthItem']?.toString() || '-';
                              } else if (col === 'accretion up to month') {
                                value = row['accretionUptoTheMonth']?.toString() || '-';
                              } else if (col === 'clearence up to month item') {
                                value = row['clearanceUptoMonthItem']?.toString() || '-';
                              } else if (col === 'clearence up to month') {
                                value = row['clearanceUptoMonth']?.toString() || '-';
                              } else if (col === 'closing balance item') {
                                value = row['closingBalanceItem']?.toString() || '-';
                              } else if (col === 'closing balance') {
                                value = row['closingBalance']?.toString() || '-';
                              }
                              
                              return (
                                <TableCell
                                  key={ci}
                                  sx={{
                                    color: "#e0e0e0",
                                    whiteSpace: "nowrap",
                                    borderBottom: "1px solid #444",
                                  }}
                                >
                                  {value}
                                </TableCell>
                              );
                            });
                          } else if (sheetName === 'Stocksheet' || sheetName === 'Stock Sheet') {
                            const columns = [
                              'department',
                              'opening balance as last year month',
                              'accretion up to month',
                              'clearence up to month',
                              'total',
                              'closing balance',
                              'remarks'
                            ];
                            
                            return columns.map((col, ci) => {
                              let value = '-';
                              
                              if (col === 'department') {
                                value = row['department']?.toString() || '-';
                              } else if (col === 'opening balance as last year month') {
                                value = row['openingBalanceAsLastYearMonth']?.toString() || '-';
                              } else if (col === 'accretion up to month') {
                                value = row['accretionUpToMonth']?.toString() || '-';
                              } else if (col === 'clearence up to month') {
                                value = row['clearanceUpToMonth']?.toString() || '-';
                              } else if (col === 'total') {
                                const accretion = parseFloat(row['accretionUpToMonth']?.toString() || '0');
                                const clearance = parseFloat(row['clearanceUpToMonth']?.toString() || '0');
                                value = (accretion + clearance).toString();
                              } else if (col === 'closing balance') {
                                value = row['closingBalance']?.toString() || '-';
                              } else if (col === 'remarks') {
                                value = row['remarks']?.toString() || '-';
                              }
                              
                              return (
                                <TableCell
                                  key={ci}
                                  sx={{
                                    color: "#e0e0e0",
                                    whiteSpace: "nowrap",
                                    borderBottom: "1px solid #444",
                                  }}
                                >
                                  {value}
                                </TableCell>
                              );
                            });
                          } else if (sheetName === 'Suspenseregister' || sheetName === 'Suspense Register') {
                            const columns = [
                              'suspense heads',
                              'position item',
                              'position',
                              'position lhr item',
                              'position lhr',
                              'closing balance item',
                              'closing balance',
                              'reconcilation month'
                            ];
                            
                            return columns.map((col, ci) => {
                              let value = '-';
                              
                              if (col === 'suspense heads') {
                                value = row['suspenseHeads']?.toString() || '-';
                              } else if (col === 'position item') {
                                value = row['positionItem']?.toString() || '-';
                              } else if (col === 'position') {
                                value = row['position']?.toString() || '-';
                              } else if (col === 'position lhr item') {
                                value = row['positionLhrItem']?.toString() || '-';
                              } else if (col === 'position lhr') {
                                value = row['positionLhr']?.toString() || '-';
                              } else if (col === 'closing balance item') {
                                value = row['closingBalanceItem']?.toString() || '-';
                              } else if (col === 'closing balance') {
                                value = row['closingBalance']?.toString() || '-';
                              } else if (col === 'reconcilation month') {
                                value = row['reconciliationMonth']?.toString() || '-';
                              }
                              
                              return (
                                <TableCell
                                  key={ci}
                                  sx={{
                                    color: "#e0e0e0",
                                    whiteSpace: "nowrap",
                                    borderBottom: "1px solid #444",
                                  }}
                                >
                                  {value}
                                </TableCell>
                              );
                            });
                          }
                          
                          return Object.values(row).map((val, ci) => (
                          <TableCell
                            key={ci}
                            sx={{
                              color: "#e0e0e0",
                              whiteSpace: "nowrap",
                              borderBottom: "1px solid #444",
                            }}
                          >
                            {val != null ? val.toString() : "-"}
                          </TableCell>
                          ));
                        })()}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            </Box>
          );
        })
      ) : (
        <Typography align="center" mt={4}>
          No data available for these parameters.
        </Typography>
      )}
    </>
  );
}

export default SheetTable;
