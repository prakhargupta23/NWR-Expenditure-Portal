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
  Checkbox,
  FormControlLabel,
} from "@mui/material";
import { getMonthYear } from "../../utils/otherUtils";
import { recoverableService } from "../../services/recoverable.service";
import { transactionService } from "../../services/transaction.service";
import { useFetchBarDataWithRetry } from "../../Hooks/useFetchCustomHook";
import BarGraphWithInnerColor from "../../modules/BarGraphWithInnerColor";
import { divisions, getLabel, months, divisionsName } from "../../utils/staticDataUtis";
import SimpleBarGraph from "../../modules/SimpleBarGraph";
import TrendBarGraph from "../../modules/TrendBarGraph";

function Recoverable({ type, reloadGraph }: any) {
  const [division, setDivision] = useState<string[]>(["Ajmer"]);
  const [selectedDataType, setSelectedDataType] = useState<string[]>([
    "openingBalance",
  ]);
  const [defaultCheckBoxMarked, setDefaultCheckBoxMarked] = useState(false);
  const [selectedDate, setSelectedDate] = useState({
    month: "January",
    year: new Date().getFullYear(),
  });
  const [trendDateRange, setTrendDateRange] = useState({
    fromMonth: "January",
    fromYear: new Date().getFullYear(),
    toMonth: "June",
    toYear: new Date().getFullYear(),
  });
  const [selectedTab, setSelectedTab] = useState("amount");
  const [selectedGraphTab, setSelectedGraphTab] = useState("Bar");
  const [selectedReportType, setSelectedReportType] = useState<"BR" | "DR">("BR");
  const dataType = [
    "openingBalance",
    "accretionUptoTheMonth",
    "clearanceUptoMonth",
    "closingBalance",
  ];
  const [varianceData, setVarianceData] = useState<any[]>([]);
  const [pieData, setPieData] = useState<any[]>([]);
  const [uniqueCategories, setUniqueCategories] = useState<any[]>([]);
  const [trendData, setTrendData] = useState<any>({});

  const currentYear = new Date().getFullYear();
  const years = Array.from(
    { length: currentYear - 1950 + 1 },
    (_, i) => 1950 + i
  );

  const { data, loading } = useFetchBarDataWithRetry({
    service: recoverableService,
    type: "Earning",
    selectedDate,
    method: "getRecoverableData",
    dependencies: [reloadGraph, selectedReportType],
  });

  // Fetch trend data separately when in trend view
  useEffect(() => {
    const fetchTrendData = async () => {
      try {
        if (selectedGraphTab === "Trend") {
          const start = getMonthYear(trendDateRange.fromMonth, trendDateRange.fromYear);
          const end = getMonthYear(trendDateRange.toMonth, trendDateRange.toYear);
          const dateRange = `${start}-${end}`;
          console.log("hello");
          const response = await transactionService.getRecoverableBarData(
            "Recoverable",
            dateRange
          );
          console.log("trendheloresponse2", response.data);
          if (response && response.data) {
            setTrendData(response.data);
          }
        }
      } catch (error) {
        console.error("Error fetching Recoverable trend data:", error);
      }
    };

    fetchTrendData();
  }, [
    selectedGraphTab,
    trendDateRange.fromMonth,
    trendDateRange.fromYear,
    trendDateRange.toMonth,
    trendDateRange.toYear,
    reloadGraph
  ]);

  const handleChartToggle = (
    event: React.MouseEvent<HTMLElement>,
    newType: any
  ) => {
    if (newType !== null) {
      setSelectedGraphTab(newType);
    }
  };

  const handleReportToggle = (
    event: React.MouseEvent<HTMLElement>,
    newValue: "BR" | "DR" | null
  ) => {
    if (newValue !== null) {
      setSelectedReportType(newValue);
    }
  };

  const handleTrendDateRangeChange = (field: string, value: string | number) => {
    setTrendDateRange(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleDivisionChangeCustom = (name: string) => {
    setDivision((prev) =>
      prev.includes(name)
        ? prev.filter((item) => item !== name)
        : [...prev, name]
    );
  };

  const handleDataTypeChangeCustom = (name: string) => {
    setSelectedDataType((prev) =>
      prev.includes(name)
        ? prev.filter((item) => item !== name)
        : [...prev, name]
    );
  };

  useEffect(() => {
    try {
      if (selectedGraphTab === "Bar") {
        processBarData();
      } else if (selectedGraphTab === "Comparison") {
        processComparisonData();
      } else if (selectedGraphTab === "Trend") {
        processTrendData();
      }
    } catch (error) {
      console.error("Error processing data:", error);
    }
  }, [
    data,
    trendData,
    selectedTab,
    selectedGraphTab,
    selectedDate,
    division,
    selectedDataType,
    defaultCheckBoxMarked,
    trendDateRange,
    selectedReportType
  ]);

  const processBarData = () => {
    const selectedMonthYear = getMonthYear(
      selectedDate.month,
      selectedDate.year
    );

    const monthData = data.filter(
      (item) => item.date === selectedMonthYear
    );

    if (!monthData || monthData.length === 0) {
      setPieData([]);
      setUniqueCategories([]);
      return;
    }

    const groupedData: Record<string, any> = {};

    const balanceKeys = [
      "openingBalance",
      "accretionUptoTheMonth",
      "clearanceUptoMonth",
      "closingBalance",
    ];

    monthData.forEach((item) => {
      const { division, type } = item;

      if (!groupedData[division]) {
        groupedData[division] = { division };

        balanceKeys.forEach((key) => {
          groupedData[division][`${key}_BR`] = 0;
          groupedData[division][`${key}_DR`] = 0;
        });
      }

      balanceKeys.forEach((key) => {
        const keyWithType = `${key}_${type}`;
        groupedData[division][keyWithType] += item[key] || 0;
      });
    });

    const formattedBarData = Object.values(groupedData).sort((a, b) => {
      return (
        divisionsName.indexOf(a.division) -
        divisionsName.indexOf(b.division)
      );
    });

    setUniqueCategories([]);
    setPieData(formattedBarData);
  };

  const processComparisonData = () => {
    const filteredData = data.filter((item) =>
      selectedReportType === "BR" ? item.type === "BR" : item.type === "DR"
    );

    const comparisonKeys = [
      "openingBalance",
      "accretionUptoTheMonth",
      "clearanceUptoMonth",
      "closingBalance",
    ];

    const comparisonData: Record<string, Record<string, number>> = {};

    filteredData.forEach((item) => {
      const { division } = item;

      comparisonKeys.forEach((key) => {
        if (!comparisonData[key]) {
          comparisonData[key] = {};
        }

        if (!comparisonData[key][division]) {
          comparisonData[key][division] = 0;
        }

        const value = item[key];
        if (typeof value === "number") {
          comparisonData[key][division] += value;
        }
      });
    });

    const formattedComparisonData = Object.entries(comparisonData).map(
      ([key, value]) => ({
        key,
        ...value,
      })
    );
    const availableDivisions = divisionsName.filter((division) =>
      formattedComparisonData.some((item) => item.hasOwnProperty(division))
    );

    const formattedComparisonDataSorted = formattedComparisonData.map(
      (item: any) => {
        const sortedItem: Record<string, any> = { key: item.key };

        availableDivisions.forEach((division) => {
          if (item.hasOwnProperty(division)) {
            sortedItem[division] = item[division];
          }
        });

        return sortedItem;
      }
    );

    setUniqueCategories(
      Object.keys(
        filteredData.reduce((acc, item) => {
          acc[item.division] = true;
          return acc;
        }, {})
      )
    );

    setPieData(formattedComparisonDataSorted);
  };

  const processTrendData = () => {
    // Generate all months in the range
    const fromDate = new Date(`1 ${trendDateRange.fromMonth} ${trendDateRange.fromYear}`);
    const toDate = new Date(`1 ${trendDateRange.toMonth} ${trendDateRange.toYear}`);
  
    const allMonthsInRange: string[] = [];
    let currentDate = new Date(fromDate);
  
    while (currentDate <= toDate) {
      allMonthsInRange.push(getMonthYear(
        months[currentDate.getMonth()],
        currentDate.getFullYear()
      ));
      currentDate.setMonth(currentDate.getMonth() + 1);
    }
  
    // Filter data by report type (BR/DR)
    const filteredData = (trendData || []).filter((item: any) => 
      selectedReportType === "BR" ? item.type === "BR" : item.type === "DR"
    );
  
    // Group data by date and division
    const groupedData: Record<string, Record<string, any>> = {};
  
    filteredData.forEach((item: any) => {
      const { date, division } = item;
      
      if (!groupedData[date]) {
        groupedData[date] = {};
      }
      
      if (!groupedData[date][division]) {
        groupedData[date][division] = {
          openingBalance: 0,
          accretionUptoTheMonth: 0,
          clearanceUptoMonth: 0,
          closingBalance: 0
        };
      }
  
      // Sum up the values for each data type
      selectedDataType.forEach(dataTypeKey => {
        if (item[dataTypeKey]) {
          groupedData[date][division][dataTypeKey] += item[dataTypeKey];
        }
      });
    });
  
    // Calculate NWR totals if needed
    if (defaultCheckBoxMarked) {
      allMonthsInRange.forEach(date => {
        if (groupedData[date]) {
          groupedData[date]["NWR"] = {
            openingBalance: 0,
            accretionUptoTheMonth: 0,
            clearanceUptoMonth: 0,
            closingBalance: 0
          };
  
          // Sum up all divisions for NWR
          Object.keys(groupedData[date]).forEach(division => {
            if (division !== "NWR") {
              selectedDataType.forEach(dataTypeKey => {
                groupedData[date]["NWR"][dataTypeKey] += groupedData[date][division][dataTypeKey] || 0;
              });
            }
          });
        }
      });
    }
  
    // Prepare the final data structure for the graph
    const processedTrendData = allMonthsInRange.flatMap(date => {
      const monthData = groupedData[date] || {};
      
      return selectedDataType.map(dataTypeKey => {
        const entry: any = { date };
        
        // Add division data
        Object.entries(monthData).forEach(([division, values]) => {
          if (defaultCheckBoxMarked && division !== "NWR") {
            // Skip individual divisions if NWR is selected
            return;
          }
          if (!defaultCheckBoxMarked && division === "NWR") {
            // Skip NWR if not selected
            return;
          }
          
          const key = `${division} - ${dataTypeKey}`;
          entry[key] = (values as any)[dataTypeKey] || 0;
        });
  
        return entry;
      });
    });
  
    // Extract and sort categories
    const categories = Array.from(
      new Set(
        processedTrendData.flatMap(item =>
          Object.keys(item).filter(key => key !== "date")
        )
      )
    ).sort((a, b) => {
      // Sort by division first, then by data type
      const [divA, typeA] = a.split(' - ');
      const [divB, typeB] = b.split(' - ');
      
      if (divA !== divB) {
        return divA.localeCompare(divB);
      }
      return selectedDataType.indexOf(typeA) - selectedDataType.indexOf(typeB);
    });
  
    setUniqueCategories(categories);
    setVarianceData(processedTrendData);
  };

  return (
    <>
      <Box sx={{
        width: "96%",
        pt: "2%",
        display: "flex",
        justifyContent: "flex-start",
        alignItems: "center",
      }}>
        <ToggleButtonGroup
          value={selectedGraphTab}
          onChange={handleChartToggle}
          exclusive
          sx={{
            backgroundColor: "#222633",
            borderRadius: "12px",
            height: "40px",
            border: "1px solid rgba(255, 255, 255, 0.3)",
          }}
        >
          {["Bar", "Trend", "Comparison"].map((label) => (
            <ToggleButton
              key={label}
              value={label}
              sx={{
                px: 2,
                color: selectedGraphTab === label ? "#fff" : "#A5A5A5",
                background: selectedGraphTab === label
                  ? "linear-gradient(90deg, #7B2FF7, #9F44D3)"
                  : "transparent",
                "&.Mui-selected": {
                  background: "linear-gradient(90deg, #7B2FF7, #9F44D3)",
                  color: "#fff",
                },
                fontSize: 16,
                fontWeight: 600,
                fontFamily: "MyCustomFont, SourceSerif4_18pt",
                textTransform: "none",
              }}
            >
              {label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>

        <ToggleButtonGroup
          value={selectedReportType}
          onChange={handleReportToggle}
          exclusive
          sx={{
            backgroundColor: "#222633",
            borderRadius: "12px",
            height: "40px",
            border: "1px solid rgba(255, 255, 255, 0.3)",
            ml: 2,
          }}
        >
          <ToggleButton
            value="BR"
            sx={{
              color: selectedReportType === "BR" ? "#fff" : "#A5A5A5",
              background: selectedReportType === "BR"
                ? "linear-gradient(90deg, #7B2FF7, #9F44D3)"
                : "transparent",
              "&.Mui-selected": {
                background: "linear-gradient(90deg, #7B2FF7, #9F44D3)",
                color: "#fff",
              },
            }}
          >
            BR
          </ToggleButton>
          <ToggleButton
            value="DR"
            sx={{
              color: selectedReportType === "DR" ? "#fff" : "#A5A5A5",
              background: selectedReportType === "DR"
                ? "linear-gradient(90deg, #7B2FF7, #9F44D3)"
                : "transparent",
              "&.Mui-selected": {
                background: "linear-gradient(90deg, #7B2FF7, #9F44D3)",
                color: "#fff",
              },
            }}
          >
            DR
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      <Paper sx={{
        display: "flex",
        margin: "12px",
        flexDirection: "column",
        height: "100%",
        width: "96%",
        borderRadius: "10px",
        backgroundColor: "#222633",
        border: "1px solid #222633",
      }}>
        <Grid container justifyContent="center" alignItems="center" sx={{
          height: "90%",
        }}>
          <Grid container alignItems="center" justifyContent="space-between" spacing={2} sx={{
            width: "100%",
            flexWrap: "wrap",
            mt: 1,
            px: 2
          }}>
            {selectedGraphTab === "Trend" ? (
              <>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="body2" sx={{ color: '#fff', mb: 1 }}>
                    From Month
                  </Typography>
                  <Select
                    value={trendDateRange.fromMonth}
                    onChange={(e) => handleTrendDateRangeChange('fromMonth', e.target.value)}
                    fullWidth
                    sx={{
                      backgroundColor: "#222633",
                      borderRadius: "10px",
                      height: "40px",
                      color: "#fff",
                      border: "1px solid rgba(255, 255, 255, 0.2)",
                      "& .MuiSelect-icon": { color: "#fff" },
                    }}
                  >
                    {months.map((month) => (
                      <MenuItem key={month} value={month}>
                        {month}
                      </MenuItem>
                    ))}
                  </Select>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="body2" sx={{ color: '#fff', mb: 1 }}>
                    From Year
                  </Typography>
                  <Select
                    value={trendDateRange.fromYear}
                    onChange={(e) => handleTrendDateRangeChange('fromYear', e.target.value)}
                    fullWidth
                    sx={{
                      backgroundColor: "#222633",
                      borderRadius: "10px",
                      height: "40px",
                      color: "#fff",
                      border: "1px solid rgba(255, 255, 255, 0.2)",
                      "& .MuiSelect-icon": { color: "#fff" },
                    }}
                  >
                    {years.map((year) => (
                      <MenuItem key={year} value={year}>
                        {year}
                      </MenuItem>
                    ))}
                  </Select>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="body2" sx={{ color: '#fff', mb: 1 }}>
                    To Month
                  </Typography>
                  <Select
                    value={trendDateRange.toMonth}
                    onChange={(e) => handleTrendDateRangeChange('toMonth', e.target.value)}
                    fullWidth
                    sx={{
                      backgroundColor: "#222633",
                      borderRadius: "10px",
                      height: "40px",
                      color: "#fff",
                      border: "1px solid rgba(255, 255, 255, 0.2)",
                      "& .MuiSelect-icon": { color: "#fff" },
                    }}
                  >
                    {months.map((month) => (
                      <MenuItem key={month} value={month}>
                        {month}
                      </MenuItem>
                    ))}
                  </Select>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="body2" sx={{ color: '#fff', mb: 1 }}>
                    To Year
                  </Typography>
                  <Select
                    value={trendDateRange.toYear}
                    onChange={(e) => handleTrendDateRangeChange('toYear', e.target.value)}
                    fullWidth
                    sx={{
                      backgroundColor: "#222633",
                      borderRadius: "10px",
                      height: "40px",
                      color: "#fff",
                      border: "1px solid rgba(255, 255, 255, 0.2)",
                      "& .MuiSelect-icon": { color: "#fff" },
                    }}
                  >
                    {years.map((year) => (
                      <MenuItem key={year} value={year}>
                        {year}
                      </MenuItem>
                    ))}
                  </Select>
                </Grid>

                <Grid item xs={12}>
                  <Box sx={{
                    display: "inline-flex",
                    overflowX: "auto",
                    gap: 1,
                    bgcolor: "#282828",
                    borderRadius: "8px",
                    whiteSpace: "nowrap",
                    width: "100%",
                    p: 1,
                  }}>
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
                              "&.Mui-checked": { color: "#FFD23D" },
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
                          checked={defaultCheckBoxMarked}
                          onChange={() => setDefaultCheckBoxMarked(!defaultCheckBoxMarked)}
                          sx={{
                            color: "#fff",
                            p: 0.25,
                            "&.Mui-checked": { color: "#FFD23D" },
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
                  <Box sx={{
                    display: "inline-flex",
                    overflowX: "auto",
                    gap: 1,
                    bgcolor: "#282828",
                    borderRadius: "8px",
                    whiteSpace: "nowrap",
                    width: "100%",
                    p: 1,
                  }}>
                    {dataType.map((d) => (
                      <FormControlLabel
                        key={d}
                        control={
                          <Checkbox
                            checked={selectedDataType.includes(d)}
                            onChange={() => handleDataTypeChangeCustom(d)}
                            sx={{
                              color: "#fff",
                              p: 0.25,
                              "&.Mui-checked": { color: "#FFD23D" },
                            }}
                          />
                        }
                        label={getLabel(d)}
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
            ) : (
              <>
                <Grid item xs={12} sm={6} md={4}>
                  <Select
                    value={selectedDate.month}
                    onChange={(e) => setSelectedDate(prev => ({ ...prev, month: e.target.value }))}
                    fullWidth
                    sx={{
                      backgroundColor: "#222633",
                      borderRadius: "10px",
                      height: "40px",
                      color: "#fff",
                      border: "1px solid rgba(255, 255, 255, 0.2)",
                      "& .MuiSelect-icon": { color: "#fff" },
                    }}
                  >
                    {months.map((month) => (
                      <MenuItem key={month} value={month}>
                        {month}
                      </MenuItem>
                    ))}
                  </Select>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Select
                    value={selectedDate.year}
                    onChange={(e) => {
                      const yearValue = Number(e.target.value);
                      setSelectedDate(prev => ({ ...prev, year: yearValue }));
                    }}
                    fullWidth
                    sx={{
                      backgroundColor: "#222633",
                      borderRadius: "10px",
                      height: "40px",
                      color: "#fff",
                      border: "1px solid rgba(255, 255, 255, 0.2)",
                      "& .MuiSelect-icon": { color: "#fff" },
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
            )}
          </Grid>

          {loading ? (
            <CircularProgress />
          ) : pieData && pieData.length > 0 ? (
            <>
              {selectedGraphTab === "Bar" ? (
                <BarGraphWithInnerColor data={pieData} />
              ) : selectedGraphTab === "Comparison" ? (
                <SimpleBarGraph data={pieData} graphType={type} />
              ) : (
                <TrendBarGraph
                  uniqueCategories={uniqueCategories}
                  lineData={varianceData}
                  selectedTab={selectedTab}
                  color="#fff"
                  dataDownload={true}
                  month={selectedDate}
                  graphType={type}
                  varianceData={varianceData}
                />
              )}
            </>
          ) : (
            <Typography sx={{
              fontFamily: "MyCustomFont,SourceSerif4_18pt",
              color: "#fff",
              py: 4
            }}>
              No Data Available
            </Typography>
          )}
        </Grid>
      </Paper>
    </>
  );
}

export default Recoverable;