import React, { useEffect, useState } from "react";
import {
  Grid,
  Paper,
  Typography,
  Box,
  CircularProgress,
  ToggleButtonGroup,
  ToggleButton,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import "../../Home.css";
import { getMonthYear } from "../../utils/otherUtils";
import { transactionService } from "../../services/transaction.service";
import BarGraph from "../../modules/BarChart";
import SimpleBarGraph from "../../modules/SimpleBarGraph";
import TrendBarGraph from "../../modules/TrendBarGraph";
import { formatKeyToLabel } from "../../utils/graphUtils";

interface DivisionData {
  LFY: number;
  "LFY Target": number;
  Actual: number;
  "CFY YTD Actual": number;
  "LFY YTD Actual": number;
}

interface TransactionData {
  [date: string]: {
    [division: string]: DivisionData;
  };
}

const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const currentYear = new Date().getFullYear();
const years = Array.from({ length: currentYear - 1999 }, (_, i) => 2000 + i);
const divisions = [
  { name: "Jaipur" },
  { name: "Jodhpur" },
  { name: "Bikaner" },
  { name: "Ajmer" },
];

const dataType = [
  "LFY",
  "LFY Target",
  "Actual",
  "CFY YTD Actual",
  "LFY YTD Actual",
] as const;

type DataType = typeof dataType[number];

interface PHExpenditureProps {
  reloadGraph?: boolean;
  setPieData?: (data: any[]) => void;
  setDataLoading?: (loading: boolean) => void;
}

function PHExpenditure({ reloadGraph, setPieData, setDataLoading }: PHExpenditureProps) {
  const [division, setDivision] = useState<string[]>(["Jaipur"]);
  const [selectedDataType, setSelectedDataType] = useState<DataType[]>(["Actual"]);
  const [defaultCheckBoxMarked, setDefaultCheckBoxMarked] = useState(false);
  const [localData, setLocalData] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState({
    month: "January",
    year: new Date().getFullYear(),
  });
  const [selectedGraphTab, setSelectedGraphTab] = useState("Bar");
  const [uniqueCategories, setUniqueCategories] = useState<any[]>([]);
  const [internalLoading, setInternalLoading] = useState(false);
  const [data, setData] = useState<TransactionData>({});
  const [dateRange, setDateRange] = useState({
    startMonth: "January",
    startYear: new Date().getFullYear(),
    endMonth: "April",
    endYear: new Date().getFullYear(),
  });
  const [showNWR, setShowNWR] = useState(true);

  const handleDivisionChangeCustom = (name: string) => {
    setDivision((prev) =>
      prev.includes(name)
        ? prev.filter((item) => item !== name)
        : [...prev, name]
    );
  };

  const handleDataTypeChangeCustom = (name: string) => {
    setSelectedDataType((prev) =>
      prev.includes(name as DataType)
        ? prev.filter((item) => item !== name as DataType)
        : [...prev, name as DataType]
    );
  };

  const handleChartToggle = (
    event: React.MouseEvent<HTMLElement>,
    newType: any
  ) => {
    if (newType !== null) {
      setSelectedGraphTab(newType);
    }
  };

  const handleDateRangeChange = (field: string, value: string | number) => {
    setDateRange(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const toggleNWR = () => {
    setShowNWR(!showNWR);
  };

  // Function to calculate NWR (sum of all divisions)
  const calculateNWR = (data: any[]) => {
    if (!data || data.length === 0) return null;

    const nwrData = { division: "NWR" } as any;
    
    // Get all data types from the first division (assuming all have same types)
    const dataTypes = Object.keys(data[0]).filter(key => key !== 'division');
    
    dataTypes.forEach(type => {
      nwrData[type] = data.reduce((sum, divisionData) => {
        return sum + (divisionData[type] || 0);
      }, 0);
    });

    return nwrData;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setInternalLoading(true);
        let monthYear;
        
        if (selectedGraphTab === "Trend") {
          // For trend view, we need data for the entire range
          const start = getMonthYear(dateRange.startMonth, dateRange.startYear);
          const end = getMonthYear(dateRange.endMonth, dateRange.endYear);
          monthYear = `${start}-${end}`;
        } else {
          // For other views, use the single month/year selection
          monthYear = getMonthYear(selectedDate.month, selectedDate.year);
        }
        
        const response = await transactionService.getTransactionBarData(
          "PHExpenditure",
          monthYear
        );
        
        if (response && response.data) {
          setData(response.data);
        }
      } catch (error) {
        console.error("Error fetching PH Expenditure data:", error);
      } finally {
        setInternalLoading(false);
      }
    };

    fetchData();
  }, [
    selectedDate.month, 
    selectedDate.year, 
    reloadGraph,
    selectedGraphTab,
    dateRange.startMonth,
    dateRange.startYear,
    dateRange.endMonth,
    dateRange.endYear
  ]);

  useEffect(() => {
    if (setDataLoading) {
      setDataLoading(internalLoading);
    }
  }, [internalLoading, setDataLoading]);

  // Process data for display
  useEffect(() => {
    try {
      const selectedMonthYear = getMonthYear(
        selectedDate.month,
        selectedDate.year
      );

      if (selectedGraphTab === "Bar") {
        const monthData = data?.[selectedMonthYear];
        if (!monthData) {
          setPieData?.([]);
          setLocalData([]);
          setUniqueCategories([]);
          return;
        }

        // Create empty data structure for all divisions
        const allDivisionsData = divisions.reduce((acc, div) => {
          acc[div.name] = monthData[div.name] || {
            LFY: 0,
            "LFY Target": 0,
            Actual: 0,
            "CFY YTD Actual": 0,
            "LFY YTD Actual": 0,
          };
          return acc;
        }, {} as Record<string, DivisionData>);

        const formattedData = Object.entries(allDivisionsData).map(([division, values]) => ({
          division,
          ...values
        }));

        // Calculate NWR data and add to the formatted data if showNWR is true
        if (showNWR) {
          const nwrData = calculateNWR(formattedData);
          if (nwrData) {
            formattedData.push(nwrData);
          }
        }

        setUniqueCategories([]);
        setPieData?.(formattedData);
        setLocalData(formattedData);
      } else if (selectedGraphTab === "Comparison") {
        const monthData = data?.[selectedMonthYear];
        
        if (!monthData) {
          setLocalData([]);
          setUniqueCategories([]);
          return;
        }

        const comparisonData = dataType.map((key) => ({
          key,
          ...Object.fromEntries(
            Object.entries(monthData).map(([division, values]) => [
              division,
              values[key] || 0,
            ])
          ),
        }));

        setUniqueCategories(Object.keys(monthData));
        setLocalData(comparisonData);
      } else {
        // Trend view - filter data by date range
        let filteredData = data || {};
        
        // Convert date range to comparable format
        const startDate = new Date(`${dateRange.startMonth} 1, ${dateRange.startYear}`);
        const endDate = new Date(`${dateRange.endMonth} 1, ${dateRange.endYear}`);
        
        // Generate all months in the range
        const allMonthsInRange: string[] = [];
        let currentDate = new Date(startDate);
        
        while (currentDate <= endDate) {
          const month = months[currentDate.getMonth()];
          const year = currentDate.getFullYear();
          const monthYear = `${getMonthYear(month, year)}`;
          allMonthsInRange.push(monthYear);
          
          // Move to next month
          currentDate.setMonth(currentDate.getMonth() + 1);
        }
        
        // Filter data by date range using MM/YYYY format
        filteredData = Object.fromEntries(
          Object.entries(data || {}).filter(([date]) => {
            // Ensure date is in MM/YYYY format before splitting
            if (!/\d{2}\/\d{4}/.test(date)) return false;
            
            const [month, year] = date.split('/');
            const currentDate = new Date(`${month} 1, ${year}`);
            
            return currentDate >= startDate && currentDate <= endDate;
          })
        );
        
        if (!defaultCheckBoxMarked) {
          filteredData = Object.fromEntries(
            Object.entries(filteredData).map(([date, divisionsData]) => [
              date,
              Object.fromEntries(
                Object.entries(divisionsData as Record<string, any>).filter(([div]) =>
                  division.includes(div)
              )
            )
            ])
          );
        }

        // Create trend data with all months in range
        const trendData = allMonthsInRange.flatMap((formattedDate) => {
          // Get the actual data for this month if it exists
          const monthData = filteredData[formattedDate] || {};
          
          return selectedDataType.map((dataTypeKey) => {
            const entry: any = { date: formattedDate };
            
            // Add division data (respecting checkbox selections)
            Object.entries(monthData as Record<string, any>).forEach(([division, values]) => {
              if (division.includes(division)) {
                const key = `${division} - ${dataTypeKey}`;
                const value = (values as Record<string, number | undefined>)[dataTypeKey];
                entry[key] = typeof value === 'number' ? value : 0;
              }
            });

            // Calculate NWR only if showNWR is true
            if (showNWR) {
              const nwrValue = ['Jaipur', 'Jodhpur', 'Bikaner', 'Ajmer'].reduce((sum: number, divName) => {
                const divisionData = data[formattedDate]?.[divName];
                if (divisionData) {
                  const val = (divisionData as unknown as DivisionData)[dataTypeKey];
                  return sum + (typeof val === 'number' ? val : 0);
                }
                return sum;
              }, 0);
              entry[`NWR - ${dataTypeKey}`] = nwrValue;
            }
          
            return entry;
          });
        });

        const categories = Array.from(
          new Set(
            trendData.flatMap((item) =>
              Object.keys(item).filter((key) => key !== "date")
            )
          )
        ).sort((a, b) => a.localeCompare(b));

        setUniqueCategories(categories);
        setLocalData(trendData);
      }
    } catch (error) {
      console.error("Error processing data:", error);
    }
  }, [
    data, 
    selectedGraphTab, 
    selectedDate, 
    division, 
    selectedDataType, 
    defaultCheckBoxMarked, 
    setPieData,
    dateRange.startMonth,
    dateRange.startYear,
    dateRange.endMonth,
    dateRange.endYear,
    showNWR
  ]);

  return (
    <>
      <Box
        sx={{
          width: "96%",
          pt: "2%",
          display: "flex",
          justifyContent: "flex-start",
          alignItems: "center",
        }}
      >
        <ToggleButtonGroup
          value={selectedGraphTab}
          onChange={handleChartToggle}
          exclusive
          sx={{
            backgroundColor: "#222633",
            borderRadius: "12px",
            height: "40px",
            border: "1px solid rgba(255, 255, 255, 0.3)",
            flexWrap: "nowrap",
          }}
        >
          {["Bar", "Trend", "Comparison"].map((label, index, arr) => (
            <ToggleButton
              key={label}
              value={label}
              sx={{
                px: 2,
                color: selectedGraphTab === label ? "#fff" : "#A5A5A5",
                background:
                  selectedGraphTab === label
                    ? "linear-gradient(90deg, #7B2FF7, #9F44D3)"
                    : "transparent",
                "&.Mui-selected": {
                  background: "linear-gradient(90deg, #7B2FF7, #9F44D3)",
                  color: "#fff",
                },
                borderRadius:
                  index === 0
                    ? "12px 0 0 12px"
                    : index === arr.length - 1
                    ? "0 12px 12px 0"
                    : "0",
                fontSize: 16,
                fontWeight: 600,
                fontFamily: "MyCustomFont, SourceSerif4_18pt",
                textTransform: "none",
                transition: "0.3s",
                whiteSpace: "nowrap",
              }}
            >
              {label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Box>

      <Paper
        elevation={3}
        sx={{
          display: "flex",
          marginTop: "4px",
          marginBottom: "4px",
          marginRight: "12px",
          marginLeft: "12px",
          flexDirection: "column",
          height: "100%",
          width: "100%",
          borderRadius: "10px",
          backgroundColor: "#222633",
          justifyContent: "flex-start",
          alignItems: "center",
          border: "1px solid #222633",
        }}
      >
        <Grid
          container
          justifyContent="center"
          alignItems="center"
          sx={{
            height: selectedGraphTab === "Bar" ? "90%" : "90%",
          }}
        >
          <Grid
            container
            alignItems="center"
            justifyContent="space-between"
            spacing={2}
            sx={{
              width: "100%",
              flexWrap: "wrap",
              mt: 1,
            }}
          >
            {selectedGraphTab === "Bar" || selectedGraphTab === "Comparison" ? (
              <>
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
                        month: e.target.value,
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
                      border: "1px solid rgba(255, 255, 255, 0.2)",
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
                <Grid
                  item
                  xs={12}
                  sm={12}
                  md={12}
                  lg={8}
                  sx={{ display: "flex", justifyContent: "center" }}
                >
                  <Select
                    value={selectedDate.year}
                    onChange={(e) =>
                      setSelectedDate((prev: any) => ({
                        ...prev,
                        year: e.target.value,
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
                      border: "1px solid rgba(255, 255, 255, 0.2)",
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
              </>
            ) : null}

            {selectedGraphTab === "Trend" && (
              <>
                <Grid item xs={12}>
                  <Box sx={{ 
                    display: 'flex', 
                    flexWrap: 'wrap', 
                    justifyContent: 'center',
                    gap: 2,
                    mb: 2
                  }}>
                    {/* Start Date Month */}
                    <Select
                      value={dateRange.startMonth}
                      onChange={(e) => handleDateRangeChange('startMonth', e.target.value)}
                      displayEmpty
                      sx={{
                        backgroundColor: "#222633",
                        borderRadius: "10px",
                        height: "40px",
                        width: "150px",
                        fontWeight: "600",
                        color: "#fff",
                        border: "1px solid rgba(255, 255, 255, 0.2)",
                        "& .MuiSelect-icon": {
                          color: "#fff",
                        },
                      }}
                    >
                      {months.map((month, index) => (
                        <MenuItem key={`start-month-${index}`} value={month}>
                          {month}
                        </MenuItem>
                      ))}
                    </Select>

                    {/* Start Date Year */}
                    <Select
                      value={dateRange.startYear}
                      onChange={(e) => handleDateRangeChange('startYear', e.target.value)}
                      displayEmpty
                      sx={{
                        backgroundColor: "#222633",
                        borderRadius: "10px",
                        height: "40px",
                        width: "120px",
                        fontWeight: "600",
                        color: "#fff",
                        border: "1px solid rgba(255, 255, 255, 0.2)",
                        "& .MuiSelect-icon": {
                          color: "#fff",
                        },
                      }}
                    >
                      {years.map((year) => (
                        <MenuItem key={`start-year-${year}`} value={year}>
                          {year}
                        </MenuItem>
                      ))}
                    </Select>

                    <Typography sx={{ 
                      color: '#fff', 
                      display: 'flex', 
                      alignItems: 'center',
                      fontFamily: "MyCustomFont, SourceSerif4_18pt",
                    }}>
                      to
                    </Typography>

                    {/* End Date Month */}
                    <Select
                      value={dateRange.endMonth}
                      onChange={(e) => handleDateRangeChange('endMonth', e.target.value)}
                      displayEmpty
                      sx={{
                        backgroundColor: "#222633",
                        borderRadius: "10px",
                        height: "40px",
                        width: "150px",
                        fontWeight: "600",
                        color: "#fff",
                        border: "1px solid rgba(255, 255, 255, 0.2)",
                        "& .MuiSelect-icon": {
                          color: "#fff",
                        },
                      }}
                    >
                      {months.map((month, index) => (
                        <MenuItem key={`end-month-${index}`} value={month}>
                          {month}
                        </MenuItem>
                      ))}
                    </Select>

                    {/* End Date Year */}
                    <Select
                      value={dateRange.endYear}
                      onChange={(e) => handleDateRangeChange('endYear', e.target.value)}
                      displayEmpty
                      sx={{
                        backgroundColor: "#222633",
                        borderRadius: "10px",
                        height: "40px",
                        width: "120px",
                        fontWeight: "600",
                        color: "#fff",
                        border: "1px solid rgba(255, 255, 255, 0.2)",
                        "& .MuiSelect-icon": {
                          color: "#fff",
                        },
                      }}
                    >
                      {years.map((year) => (
                        <MenuItem key={`end-year-${year}`} value={year}>
                          {year}
                        </MenuItem>
                      ))}
                    </Select>
                  </Box>
                </Grid>

                <Grid item xs={12}>
                  <Box
                    sx={{
                      display: "inline-flex",
                      overflowX: "auto",
                      gap: 1,
                      bgcolor: "#282828",
                      borderRadius: "8px",
                      whiteSpace: "nowrap",
                      width: "100%",
                      scrollbarColor: "#444 #000",
                      "&::-webkit-scrollbar": {
                        height: 4,
                      },
                      "&::-webkit-scrollbar-track": {
                        backgroundColor: "#000",
                        borderRadius: 8,
                      },
                      "&::-webkit-scrollbar-thumb": {
                        backgroundColor: "#444",
                        borderRadius: 8,
                      },
                    }}
                  >
                    {divisions.map((d) => (
                      <FormControlLabel
                        key={d.name}
                        control={
                          <Checkbox
                            checked={division.includes(d.name)}
                            onChange={() => handleDivisionChangeCustom(d.name)}
                            sx={{
                              color: "#fff",
                              p: 0.25,
                              "&.Mui-checked": {
                                color: "#FFD23D",
                              },
                            }}
                          />
                        }
                        label={d.name}
                        sx={{
                          color: "#fff",
                          fontSize: "0.85rem",
                          fontFamily: "MyCustomFont, SourceSerif4_18pt",
                          m: 0,
                          flex: "0 0 auto",
                        }}
                      />
                    ))}
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={showNWR}
                          onChange={toggleNWR}
                          sx={{
                            color: "#fff",
                            p: 0.25,
                            "&.Mui-checked": {
                              color: "#FFD23D",
                            },
                          }}
                        />
                      }
                      label="NWR"
                      sx={{
                        color: "#fff",
                        fontSize: "0.85rem",
                        fontFamily: "MyCustomFont, SourceSerif4_18pt",
                        m: 0,
                        flex: "0 0 auto",
                      }}
                    />
                  </Box>
                </Grid>

                <Grid item xs={12}>
                  <Box
                    sx={{
                      display: "inline-flex",
                      overflowX: "auto",
                      gap: 1,
                      bgcolor: "#282828",
                      borderRadius: "8px",
                      whiteSpace: "nowrap",
                      width: "100%",
                      scrollbarColor: "#444 #000",
                      "&::-webkit-scrollbar": {
                        height: 4,
                      },
                      "&::-webkit-scrollbar-track": {
                        backgroundColor: "#000",
                        borderRadius: 8,
                      },
                      "&::-webkit-scrollbar-thumb": {
                        backgroundColor: "#444",
                        borderRadius: 8,
                      },
                    }}
                  >
                    {dataType.map((d) => (
                      <FormControlLabel
                        key={d}
                        control={
                          <Checkbox
                            checked={selectedDataType.includes(d as DataType)}
                            onChange={() => handleDataTypeChangeCustom(d)}
                            sx={{
                              color: "#fff",
                              p: 0.25,
                              "&.Mui-checked": { color: "#FFD23D" },
                            }}
                          />
                        }
                        label={formatKeyToLabel(d)}
                        sx={{
                          color: "#fff",
                          fontSize: "0.85rem",
                          fontFamily: "MyCustomFont, SourceSerif4_18pt",
                          m: 0,
                          flex: "0 0 auto",
                        }}
                      />
                    ))}
                  </Box>
                </Grid>
              </>
            )}
          </Grid>

          {(setDataLoading ? internalLoading : internalLoading) ? (
            <CircularProgress />
          ) : localData && localData.length > 0 ? (
            <>
              {selectedGraphTab === "Bar" ? (
                <BarGraph 
                  data={localData} 
                  stackId={false} 
                  type="PHExpenditure"
                  showEmptyBars={true}
                  divisions={divisions.map(d => d.name)}
                />
              ) : selectedGraphTab === "Comparison" ? (
                <SimpleBarGraph data={localData} graphType="PHExpenditure" />
              ) : (
                <TrendBarGraph
                  uniqueCategories={uniqueCategories}
                  defaultCheckBoxMarked={defaultCheckBoxMarked}
                  setDefaultCheckBoxMarked={setDefaultCheckBoxMarked}
                  lineData={localData}
                  selectedTab="amount"
                  color="#fff"
                  dataDownload={true}
                  month={selectedDate}
                  graphType="PHExpenditure"
                  colors={[
                    "#FF1493", // Deep Pink
                    "#00FFFF", // Cyan
                    "#7FFF00", // Chartreuse
                    "#FF4500", // Orange Red
                    "#9400D3", // Dark Violet
                    "#00FF00", // Lime
                    "#FFD700", // Gold
                    "#FF00FF", // Magenta
                    "#00BFFF", // Deep Sky Blue
                    "#FF69B4", // Hot Pink
                  ]}
                  showLabels={false}
                  barColors={[
                    "#FF1493", // Deep Pink
                    "#00FFFF", // Cyan
                    "#7FFF00", // Chartreuse
                    "#FF4500", // Orange Red
                    "#9400D3", // Dark Violet
                    "#00FF00", // Lime
                    "#FFD700", // Gold
                    "#FF00FF", // Magenta
                    "#00BFFF", // Deep Sky Blue
                    "#FF69B4", // Hot Pink
                  ]}
                />
              )}
            </>
          ) : (
            <Typography
              sx={{
                fontFamily: "MyCustomFont,SourceSerif4_18pt",
                color: "#fff",
              }}
            >
              No Data Available
            </Typography>
          )}
        </Grid>
      </Paper>
    </>
  );
}

export default PHExpenditure;