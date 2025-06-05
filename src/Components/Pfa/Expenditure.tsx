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
  Tooltip,
} from "@mui/material";
import { getMonthYear } from "../../utils/otherUtils";
import { transactionService } from "../../services/transaction.service";
import { useFetchBarDataWithRetry } from "../../Hooks/useFetchCustomHook";
import BarGraph from "../../modules/BarChart";
import SimpleBarGraph from "../../modules/SimpleBarGraph";
import TrendBarGraph from "../../modules/TrendBarGraph";
import { formatKeyToLabel } from "../../utils/graphUtils";
import { months, years, divisionsName } from "../../utils/staticDataUtis";

function Expenditure({ type, reloadGraph, setPieData, setDataLoading }: any) {
  const desiredKeyOrderForComparisonForExpenditureEarning = [
    "actualLastFinancialYear",
    "targetCurrentFinancialYear",
    "targetThisMonth",
    "actualThisMonth"
  ];
  const [division, setDivision] = useState<string[]>(["Ajmer"]);
  const [selectedDataType, setSelectedDataType] = useState<string[]>([
    "targetThisMonth",
  ]);
  const [defaultCheckBoxMarked, setDefaultCheckBoxMarked] = useState(false);
  const [localData, setLocalData] = useState<any[]>([]);
  const [forceReload, setForceReload] = useState(false);

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
  const [selectedType, setSelectedType] = useState<"BR" | "DR">("BR");
  const dataType = [
    "targetThisMonth",
    "actualThisMonth",
    "targetYTDThisMonth",
    "actualYTDThisMonthLastYear",
    "actualYTDThisMonth",
    "actualLastFinancialYear",
  ];
  const [varianceData, setVarianceData] = useState<any[]>([]);
  const [uniqueCategories, setUniqueCategories] = useState<any[]>([]);

  // Add month-year options
  const monthYearOptions = years.flatMap(year => 
    months.map(month => `${month}/${year}`)
  );

  const handleChartToggle = (
    event: React.MouseEvent<HTMLElement>,
    newType: any
  ) => {
    if (newType !== null) {
      setSelectedGraphTab(newType);
    }
  };

  const handleDateRangeChange = (field: string, value: any) => {
    setTrendDateRange(prev => {
      const newRange = {
        ...prev,
        [field]: value
      };
      
      // Check if range exceeds 6 months
      const fromDate = new Date(`1 ${newRange.fromMonth} ${newRange.fromYear}`);
      const toDate = new Date(`1 ${newRange.toMonth} ${newRange.toYear}`);
      
      const monthDiff = (toDate.getFullYear() - fromDate.getFullYear()) * 12 + 
                       (toDate.getMonth() - fromDate.getMonth()) + 1;
      
      if (monthDiff > 6) {
        const adjustedToDate = new Date(fromDate);
        adjustedToDate.setMonth(adjustedToDate.getMonth() + 5);
        
        return {
          ...newRange,
          toMonth: months[adjustedToDate.getMonth()],
          toYear: adjustedToDate.getFullYear()
        };
      }
      
      return newRange;
    });
    setForceReload(prev => !prev); // Trigger reload
  };

  const getDefaultNwrShades = (count: number) => {
    // Custom color palette for NWR bars
    const baseColors = [
      "#4e79a7", "#f28e2b", "#e15759", "#76b7b2", 
      "#59a14f", "#edc948", "#b07aa1", "#ff9da7", 
      "#9c755f", "#bab0ac"
    ];
    
    return baseColors.slice(0, count);
  };

  const { data, loading } = useFetchBarDataWithRetry({
    service: transactionService,
    type: type,
    selectedDate,
    method: "getTransactionBarData",
    dependencies: [reloadGraph, forceReload],
  });
  
  useEffect(() => {
    setDataLoading(loading);
  }, [loading]);

  useEffect(() => {
    try {
      if (selectedGraphTab === "Trend") {
        processTrendData();
      } else if (selectedGraphTab === "Bar") {
        processBarData();
      } else if (selectedGraphTab === "Comparison") {
        processComparisonData();
      }
    } catch (error) {
      console.error("Error processing data:", error);
    }
  }, [
    data,
    selectedTab,
    selectedGraphTab,
    selectedDate,
    division,
    selectedDataType,
    defaultCheckBoxMarked,
    trendDateRange,
    forceReload
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
      setLocalData([]);
      setUniqueCategories([]);
      return;
    }

    const cleanedMonthData = monthData.map(
      ({ date, subCategory, ...rest }) => ({
        ...rest,
      })
    );

    const groupedData: Record<string, any> = {};

    cleanedMonthData.forEach((item) => {
      const { division, ...rest } = item;

      if (!groupedData[division]) {
        groupedData[division] = { division };

        Object.keys(rest).forEach((key) => {
          if (!["actualLastFinancialYear"].includes(key)) {
            groupedData[division][key] = 0;
          }
        });
      }

      Object.keys(rest).forEach((key) => {
        if (!["actualLastFinancialYear"].includes(key)) {
          groupedData[division][key] += item[key] || 0;
        }
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
    setLocalData(formattedBarData);
  };

  const processComparisonData = () => {
    let comparisonKeys = type === "Expenditure" ? [
      "actualLastFinancialYear",
      "targetCurrentFinancialYear",
      "targetThisMonth",
      "actualThisMonth",
    ] : [
      "actualLastFinancialYear",
      "targetThisMonth",
      "actualThisMonth",
    ];

    const selectedMonthYear = getMonthYear(
      selectedDate.month,
      selectedDate.year
    );

    const filteredDataForMonth = data.filter(
      (item) => item.date === selectedMonthYear
    );

    const comparisonData: Record<string, Record<string, number>> = {};

    filteredDataForMonth.forEach((item) => {
      const { division } = item;

      comparisonKeys.forEach((key: any) => {
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

    const formattedComparisonDataSorted = formattedComparisonData
      .sort((a, b) => {
        return (
          desiredKeyOrderForComparisonForExpenditureEarning.indexOf(a.key) -
          desiredKeyOrderForComparisonForExpenditureEarning.indexOf(b.key)
        );
      })
      .map((item: any) => {
        const sortedItem: Record<string, any> = { key: item.key };

        availableDivisions.forEach((division) => {
          if (item.hasOwnProperty(division)) {
            sortedItem[division] = item[division];
          }
        });

        return sortedItem;
      });

    setUniqueCategories(
      Object.keys(
        filteredDataForMonth.reduce((acc, item) => {
          acc[item.division] = true;
          return acc;
        }, {})
      )
    );

    setLocalData(formattedComparisonDataSorted);
  };

  const processTrendData = () => {
    let filteredDivisionData = defaultCheckBoxMarked
      ? data
      : data.filter((item) => division.includes(item.division));

    // Generate all months in the selected range
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

    // Filter and fill missing months for each division
    const filteredByDateRange = allMonthsInRange.flatMap(month => {
      const foundData = filteredDivisionData.filter(item => item.date === month);

      if (foundData.length > 0) {
        return foundData;
      }

      // Create empty data for missing months for each selected division
      return defaultCheckBoxMarked
        ? [{
            date: month,
            division: "NWR", // Use "NWR" as a temporary division for aggregation
            ...Object.fromEntries(dataType.map(key => [key, 0]))
          }]
        : division.map(div => ({
            date: month,
            division: div,
            ...Object.fromEntries(dataType.map(key => [key, 0]))
          }));
    });

    // Group by month and division
    const groupedByMonth: Record<string, Record<string, any>> = {};

    filteredByDateRange.forEach((item) => {
      const month = item.date;
      const div = item.division;

      if (!groupedByMonth[month]) {
        groupedByMonth[month] = { date: month };
      }

      // Process each selected data type for the division
      selectedDataType.forEach(dataType => {
        const value = item[dataType];
        if (typeof value === "number") {
          const key = `${div} - ${dataType}`;
          groupedByMonth[month][key] = (groupedByMonth[month][key] || 0) + value; // Summing up in case of multiple entries for the same month/div/datatype
        }
      });
    });

    // Calculate NWR only if defaultCheckBoxMarked is true (NWR is selected)
    if (defaultCheckBoxMarked) {
      allMonthsInRange.forEach((formattedDate) => {
        selectedDataType.forEach(dataTypeKey => {
          const nwrValue = ['Jaipur', 'Jodhpur', 'Bikaner', 'Ajmer'].reduce((sum: number, divName) => {
            const key = `${divName} - ${dataTypeKey}`;
            // Sum the already aggregated division data from groupedByMonth
            return sum + (groupedByMonth[formattedDate]?.[key] || 0);
          }, 0);

          // Add NWR total for this data type to the grouped data for this month
          if (!groupedByMonth[formattedDate]) {
            groupedByMonth[formattedDate] = { date: formattedDate };
          }
          groupedByMonth[formattedDate][`NWR - ${dataTypeKey}`] = nwrValue;

          // Log data for debugging
          console.log(
            `Month: ${formattedDate}, Data Type: ${dataTypeKey}, NWR Total: ${nwrValue}`,
            `Divisions: Jaipur - ${groupedByMonth[formattedDate]?.['Jaipur - ' + dataTypeKey] || 0}, `,
            `Jodhpur - ${groupedByMonth[formattedDate]?.['Jodhpur - ' + dataTypeKey] || 0}, `,
            `Bikaner - ${groupedByMonth[formattedDate]?.['Bikaner - ' + dataTypeKey] || 0}, `,
            `Ajmer - ${groupedByMonth[formattedDate]?.['Ajmer - ' + dataTypeKey] || 0}`
          );
        });
      });
    }

    // Step 3: Convert grouped data into trendData format
    interface TrendDataItem {
      date: string;
      [key: string]: any;
    }

    const processedTrendData: TrendDataItem[] = Object.entries(groupedByMonth).map(
      ([month, data]) => ({
        date: month,
        ...data,
      })
    );

    // Extract and filter categories
    const allCategories = Array.from(
      new Set(processedTrendData.flatMap(item =>
        Object.keys(item).filter(key => key !== "date")
      ))
    ).filter(category =>
      processedTrendData.some(item => typeof item[category] === 'number' && item[category] > 0)
    );

    // Sort categories if not using NWR
    let filteredCategoriesSorted = allCategories;
    if (!defaultCheckBoxMarked) {
      filteredCategoriesSorted = allCategories.sort((a, b) => {
        const divisionA = divisionsName.find(d => a.includes(d)) ?? "";
        const divisionB = divisionsName.find(d => b.includes(d)) ?? "";
        return divisionsName.indexOf(divisionA) - divisionsName.indexOf(divisionB);
      });
    } else {
       // If NWR is selected, sort to place NWR categories at the end
       filteredCategoriesSorted = allCategories.sort((a, b) => {
         const isNWRA = a.includes('NWR - ');
         const isNWRB = b.includes('NWR - ');
         if (isNWRA && !isNWRB) return 1;
         if (!isNWRA && isNWRB) return -1;
         // Keep existing sorting for non-NWR categories, or sort NWR categories alphabetically
         return a.localeCompare(b);
       });
    }

    let filteredTrendData = processedTrendData.map(item => {
      const filteredItem: any = { date: item.date };
      filteredCategoriesSorted.forEach(category => {
        if (item.hasOwnProperty(category)) {
          filteredItem[category] = item[category];
        } else {
          // Ensure all categories are present for each month, even with a value of 0
           filteredItem[category] = 0;
        }
      });
      return filteredItem;
    });

    setUniqueCategories(filteredCategoriesSorted);
    setLocalData(filteredTrendData);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      // Group payload by division
      const groupedByDivision = payload.reduce((acc: Record<string, any[]>, entry: any) => {
        const [division, dataType] = entry.name.split(' - ');
        if (!acc[division]) {
          acc[division] = [];
        }
        acc[division].push({ ...entry, dataType });
        return acc;
      }, {});

      return (
        <Paper sx={{ 
          padding: 2, 
          backgroundColor: 'rgba(34, 38, 51, 0.95)',
          border: '1px solid #444',
          minWidth: 250
        }}>
          <Typography variant="body2" sx={{ 
            color: '#fff',
            fontSize: '0.75rem',
            mb: 1,
            fontStyle: 'italic'
          }}>
            figures in thousands
          </Typography>
          <Typography variant="body2" sx={{ 
            color: '#fff', 
            fontWeight: 'bold',
            mb: 1,
            borderBottom: '1px solid #444',
            pb: 1
          }}>
            {label}
          </Typography>
          
          {Object.entries(groupedByDivision).map(([division, entries]: [string, unknown], index: number) => {
            const typedEntries = entries as Array<{ dataType: string; value: number; color: string }>;
            return (
              <Box key={division} sx={{ mb: 1 }}>
                <Typography variant="body2" sx={{ 
                  color: '#fff',
                  fontWeight: 'bold',
                  mb: 0.5
                }}>
                  {division}
                </Typography>
                <Typography variant="body2" sx={{ color: '#fff' }}>
                  hello
                </Typography>
                {typedEntries
                  .sort((a, b) => {
                    const order = [
                      'targetThisMonth',
                      'actualThisMonth',
                      'targetYTDThisMonth',
                      'actualYTDThisMonthLastYear',
                      'actualYTDThisMonth',
                      'actualLastFinancialYear'
                    ];
                    return order.indexOf(a.dataType) - order.indexOf(b.dataType);
                  })
                  .map((entry, index) => (
                    <Box key={`${division}-${index}`} sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      pl: 2,
                      mb: 0.5
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Box 
                          component="span" 
                          sx={{
                            width: 10,
                            height: 10,
                            backgroundColor: entry.color,
                            display: 'inline-block',
                            marginRight: 1,
                            borderRadius: '2px'
                          }}
                        />
                        <Typography variant="body2" sx={{ color: '#fff' }}>
                          {formatKeyToLabel(entry.dataType)}
                        </Typography>
                      </Box>
                      <Typography variant="body2" sx={{ 
                        color: '#fff',
                        fontWeight: 'medium'
                      }}>
                        {entry.value.toLocaleString()}
                      </Typography>
                    </Box>
                  ))}
              </Box>
            );
          })}
        </Paper>
      );
    }
    return null;
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
            flexWrap: "nowrap",
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
                whiteSpace: "nowrap",
              }}
            >
              {label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Box>

      <Paper sx={{
        display: "flex",
        margin: "4px 12px",
        flexDirection: "column",
        height: "100%",
        width: "100%",
        borderRadius: "10px",
        backgroundColor: "#222633",
        border: "1px solid #222633",
      }}>
        <Grid container justifyContent="center" alignItems="center" sx={{
          height: selectedGraphTab === "Bar" ? "90%" : "90%",
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
                    onChange={(e) => handleDateRangeChange('fromMonth', e.target.value)}
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
                    onChange={(e) => handleDateRangeChange('fromYear', e.target.value)}
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
                    onChange={(e) => handleDateRangeChange('toMonth', e.target.value)}
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
                    onChange={(e) => handleDateRangeChange('toYear', e.target.value)}
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
                    scrollbarColor: "#444 #000",
                  }}>
                    {[{ name: "NWR" }, ...divisionsName.map(name => ({ name }))].map((d) => (
                      <FormControlLabel
                        key={d.name}
                        control={
                          <Checkbox
                            checked={
                              d.name === "NWR"
                                ? defaultCheckBoxMarked
                                : division.includes(d.name)
                            }
                            onChange={() => {
                              if (d.name === "NWR") {
                                setDefaultCheckBoxMarked(!defaultCheckBoxMarked);
                                if (!defaultCheckBoxMarked) setDivision([]);
                              } else if (!defaultCheckBoxMarked) {
                                handleDivisionChangeCustom(d.name);
                              }
                            }}
                            sx={{
                              color: "#fff",
                              p: 0.25,
                              "&.Mui-checked": { color: "#571F90" },
                            }}
                            disabled={defaultCheckBoxMarked && d.name !== "NWR"}
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
                    scrollbarColor: "#444 #000",
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
                              "&.Mui-checked": { color: "##571F90" },
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
          ) : localData && localData.length > 0 ? (
            <>
              {selectedGraphTab === "Bar" ? (
                <BarGraph data={localData} stackId={false} type={type} />
              ) : selectedGraphTab === "Comparison" ? (
                <SimpleBarGraph data={localData} graphType={type} />
              ) : (
                <TrendBarGraph
                  uniqueCategories={uniqueCategories}
                  defaultCheckBoxMarked={defaultCheckBoxMarked}
                  lineData={localData}
                  selectedTab={selectedTab}
                  color="#fff"
                  dataDownload={true}
                  month={selectedDate}
                  graphType={type}
                  varianceData={varianceData}
                  customTooltip={<CustomTooltip />}
                  getDefaultNwrShades={getDefaultNwrShades}
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

export default Expenditure;