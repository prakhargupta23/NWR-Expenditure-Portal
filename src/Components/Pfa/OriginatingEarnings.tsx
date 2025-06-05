import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  ToggleButtonGroup,
  ToggleButton,
  Typography,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  FormControlLabel,
  Radio,
  RadioGroup,
  Checkbox,
  Grid,
  Button,
  ListItemText,
} from '@mui/material';
import { Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { fetchPerformanceData, fetchVarianceData, PerformanceData } from '../../services/performanceService';
import { divisionsName } from "../../utils/staticDataUtis";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const YEARS = ["2023", "2024", "2025"];

const METRICS = ["Pass","OCH", "Goods", "Sundry"];

interface OriginatingEarningsProps {
  getDivisionName: (division: string) => string;
}

interface DatasetType {
  label: string;
  data: any[];
  borderColor: string;
  backgroundColor: string;
  borderWidth: number;
  borderDash?: [number, number];
}

const OriginatingEarnings: React.FC<OriginatingEarningsProps> = ({ getDivisionName }) => {
  //for data view
  const [view, setView] = useState<'data' | 'trend'>('data');
  const [selectedMonth, setSelectedMonth] = useState<string>("January");
  const [selectedYear, setSelectedYear] = useState<string>("2025");
  const [selectedMetric, setSelectedMetric] = useState<string>("Pass");
  const [performanceData, setPerformanceData] = useState<PerformanceData[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  //trend view
  const [selecteddivisionsName, setSelecteddivisionsName] = useState<string[]>(divisionsName);
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(["Target", "Current Year"]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(["Pass"]);
  const [varianceData, setVarianceData] = useState<PerformanceData[]>([]);
  const [varianceLoading, setVarianceLoading] = useState<boolean>(false);
  const [varianceError, setVarianceError] = useState<string | null>(null);

  // Date range for variance
  const [fromMonth, setFromMonth] = useState<string>("January");
  const [fromYear, setFromYear] = useState<string>("2025");
  const [toMonth, setToMonth] = useState<string>("April");
  const [toYear, setToYear] = useState<string>("2025");

  const [showNWR, setShowNWR] = useState<boolean>(true);

  const handleViewChange = (_: any, newView: 'data' | 'trend') => {
    if (newView !== null) setView(newView);
  };

  const handleMonthChange = (event: any) => {
    setSelectedMonth(event.target.value);
  };

  const handleYearChange = (event: any) => {
    setSelectedYear(event.target.value);
  };

  const handleMetricChange = (event: any) => {
    setSelectedMetric(event.target.value);
  };

  // Handle division checkbox changes
  const handleDivisionChange = (division: string) => {
    setSelecteddivisionsName(prev => {
      // If trying to uncheck the last selected division, prevent it
      if (prev.includes(division) && prev.length === 1) {
        return prev;
      }
      return prev.includes(division) 
        ? prev.filter(d => d !== division) 
        : [...prev, division];
    });
  };

  // Handle metric checkbox changes
  const handleMetricTypeChange = (metric: string) => {
    if (selectedMetrics.includes(metric)) {
      // If the metric is already selected, remove it
      setSelectedMetrics(selectedMetrics.filter(m => m !== metric));
    } else {
      // If selecting a new metric
      if (selectedMetrics.length >= 2) {
        // If we already have 2 metrics selected, remove the first one and add the new one
        setSelectedMetrics([...selectedMetrics.slice(1), metric]);
      } else {
        // If we have less than 2 metrics selected, just add the new one
        setSelectedMetrics([...selectedMetrics, metric]);
      }
    }
  };

  // Handle category checkbox changes
  const handleCategoryChange = (category: string) => {
    setSelectedCategories(prev => {
      // If the category is already selected, do nothing (keep it selected)
      if (prev.includes(category)) {
        return prev;
      }
      
      // Otherwise, replace the current selection with the new category
      return [category];
    });
  };

  // Handle apply button click for variance
  const handleApplyVariance = async () => {
    setVarianceLoading(true);
    setVarianceError(null);
    try {
      const fromMonthIndex = MONTHS.indexOf(fromMonth) + 1;
      const toMonthIndex = MONTHS.indexOf(toMonth) + 1;
      
      // Validate date range
      const fromDate = new Date(parseInt(fromYear), fromMonthIndex - 1);
      const toDate = new Date(parseInt(toYear), toMonthIndex - 1);
      const diffMonths = (toDate.getFullYear() - fromDate.getFullYear()) * 12 + 
                        (toDate.getMonth() - fromDate.getMonth());
      
      if (diffMonths > 4) {
        setVarianceError('Date range cannot be more than 4 months');
        return;
      }
      
      if (fromDate > toDate) {
        setVarianceError('From date cannot be after To date');
        return;
      }

      // Format dates as MM/YYYY
      const fromDateStr = `${fromMonthIndex.toString().padStart(2, '0')}/${fromYear}`;
      const toDateStr = `${toMonthIndex.toString().padStart(2, '0')}/${toYear}`;
      
      const response = await fetchVarianceData(
        selecteddivisionsName,
        selectedCategories,
        selectedMetrics,
        `${fromDateStr}-${toDateStr}`
      );
      setVarianceData(response.data);
    } catch (err) {
      console.error('Error fetching variance data:', err);
      setVarianceError('Failed to load variance data');
    } finally {
      setVarianceLoading(false);
    }
  };

  // Effect to automatically fetch variance data when selections change
  useEffect(() => {
    if (view === 'trend') {
      handleApplyVariance();
    }
  }, [selecteddivisionsName, selectedMetrics, selectedCategories, view]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const monthIndex = MONTHS.indexOf(selectedMonth) + 1;
        // Format month as MM/YYYY with the selected year
        const monthYear = `${monthIndex.toString().padStart(2, '0')}/${selectedYear}`;
        
        const type="Earning"
        const response = await fetch(
          `https://nwr-pension-2025.azurewebsites.net/api/get-transaction-data?type=${type}`
        );
        
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        
        const data = await response.json();
        // console.log("this is metric",selectedMetric);
        // console.log('this is date',monthYear);
        
        // console.log("Test data",data)

        if (data && data.data) {
          // Filter data for the selected month and year
          const filteredData = data.data.filter((item: any) => {  
            return monthYear === item.date && item.subCategory === selectedMetric;
          });
          // console.log("Test data 1",filteredData)
          
          // Transform the filtered data to match the expected format
          const transformedData = filteredData.map((item: any) => ({
            Division: item.division,
            Description: selectedMetric,
            MonthYear: item.date,
            Target: item.targetYTDThisMonth,
            Actual_CFY: item.actualYTDThisMonth,
            Actual_Last_Year: item.actualYTDThisMonthLastYear,
            Cumulative_Target: item.targetThisMonth,
            Cumulative_Actual_CFY: item.actualThisMonth,
            Cumulative_Actual_Last_Year: item.actualThisMonthLastYear,


            // Cumulative_Target: item.targetYTDThisMonth,
            // Cumulative_Actual_CFY: item.actualYTDThisMonth,
            // Cumulative_Actual_Last_Year: item.actualYTDThisMonthLastYear,
            // Target: item.targetThisMonth,
            // Actual_CFY: item.actualThisMonth,
            // Actual_Last_Year: item.actualThisMonthLastYear
          }));
          
          setPerformanceData(transformedData);
        } else {
          setError('No data available for the selected period');
          setPerformanceData([]);
        }
      } catch (err) {
        console.error('Error fetching performance data:', err);
        setError('Failed to load data for the selected period');
        setPerformanceData([]);
      } finally {
        setLoading(false);
      }
    };

    if (view === 'data') {
      fetchData();
    }
  }, [selectedMonth, selectedMetric, selectedYear, view]);

  // Process data for the chart
  const dataChart = {
    labels: ['Target', 'Actual', 'Last Year'],
    datasets: [
      {
        label: 'Jaipur',
        data: [
          performanceData.find(item => item.Division === "Jaipur")?.Target || 0,
          performanceData.find(item => item.Division === "Jaipur")?.Actual_CFY || 0,
          performanceData.find(item => item.Division === "Jaipur")?.Actual_Last_Year || 0
        ],
        backgroundColor: '#FF6F61',
        borderColor: '#FF6F61',
        borderWidth: 2,
      },
      {
        label: 'Jodhpur',
        data: [
          performanceData.find(item => item.Division === "Jodhpur")?.Target || 0,
          performanceData.find(item => item.Division === "Jodhpur")?.Actual_CFY || 0,
          performanceData.find(item => item.Division === "Jodhpur")?.Actual_Last_Year || 0
        ],
        backgroundColor: '#FFA500',
        borderColor: '#FFA500',
        borderWidth: 2,
      },
      {
        label: 'Ajmer',
        data: [
          performanceData.find(item => item.Division === "Ajmer")?.Target || 0,
          performanceData.find(item => item.Division === "Ajmer")?.Actual_CFY || 0,
          performanceData.find(item => item.Division === "Ajmer")?.Actual_Last_Year || 0
        ],
        backgroundColor: '#88B04B',
        borderColor: '#88B04B',
        borderWidth: 2,
      },
      {
        label: 'Bikaner',
        data: [
          performanceData.find(item => item.Division === "Bikaner")?.Target || 0,
          performanceData.find(item => item.Division === "Bikaner")?.Actual_CFY || 0,
          performanceData.find(item => item.Division === "Bikaner")?.Actual_Last_Year || 0
        ],
        backgroundColor: '#6B5B95',
        borderColor: '#6B5B95',
        borderWidth: 2,
      }
    ],
  };
  

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 0
    },
    plugins: {
      legend: {
        display: false
      },
      title: {
        display: true,
        text: `${selectedMetric} Performance by Target, Current Year, and Last Year`,
        color: 'white',
        font: {
          size: 16,
          weight: 'bold' as const,
        },
      },
      tooltip: {
        callbacks: {
          title: (tooltipItems: any) => {
            return tooltipItems[0].label;
          },
          label: (context: any) => {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            return `${label}: ₹${value}k`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          color: 'white',
          callback: function(value: any) {
            return value + 'k';
          }
        },
      },
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          color: 'white',
        },
      },
    },
  };

  // Process data for the variance chart
  const varianceChartData = {
    // labels: ['January', 'February', 'March', 'April'],
    datasets: selecteddivisionsName.flatMap(division => {
      const divisionName = getDivisionName(division);
      
      return selectedCategories.flatMap(category => {
        return selectedMetrics.map(metric => {
          const data = Array(4).fill(0);
          varianceData.forEach(item => {
            if (item.Division === division && item.Description === category) {
              const monthIndex = ['01', '02', '03', '04'].indexOf(item.MonthYear.split('-')[1]);
              if (monthIndex !== -1) {
                if (metric === 'Target' && item.Cumulative_Target !== undefined) {
                  data[monthIndex] = item.Cumulative_Target;
                } else if (metric === 'Current Year' && item.Cumulative_Actual_CFY !== undefined) {
                  data[monthIndex] = item.Cumulative_Actual_CFY;
                } else if (metric === 'Last Year' && item.Cumulative_Actual_Last_Year !== undefined) {
                  data[monthIndex] = item.Cumulative_Actual_Last_Year;
                }
              }
            }
          });
          
         
          
          // Set color based on division only (not category)
          let color = "";
          if (division === "Jaipur") {
            color = "#FF6F61";
          } else if (division === "Jodhpur") {
            color = "#FFA500";
          } else if (division === "Ajmer") {
            color = "#88B04B";
          } else if (division === "Bikaner") {
            color = "#6B5B95";
          }
          
          // Create dataset object
          const dataset: any = {
            label: `${divisionName} - ${category} - ${metric}`,
            data: data,
            borderColor: color,
            backgroundColor: color,
            borderWidth: 2,
          };
          
          return dataset;
        });
      });
    }),
  };

  const varianceOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 0
    },
    plugins: {
      legend: {
        display: false
      },
      title: {
        display: true,
        text: `${selectedCategories[0] || 'Pass'} Performance Trend by Division`,
        color: 'white',
        font: {
          size: 16,
          weight: 'bold' as const,
        },
      },
      tooltip: {
        callbacks: {
          title: (tooltipItems: any) => {
            return tooltipItems[0].label;
          },
          label: (context: any) => {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            return `${label}: ${value}k`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          color: 'white',
          callback: function(value: any) {
            return value + 'k';
          }
        },
      },
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          color: 'white',
        },
      },
    },
  };

  const fetchVarianceData = async (
    selecteddivisionsName: string[],
    selectedCategories: string[],
    selectedMetrics: string[],
    dateRange: string
  ) => {
    try {
      const [fromDate, toDate] = dateRange.split('-');
      const [fromMonth, fromYear] = fromDate.split('/');
      const [toMonth, toYear] = toDate.split('/');
      
      // Convert metric to the correct type for the API
      const type = 'Earning'; 
      
      // Fetch all data at once
      const response = await fetch(
        `https://nwr-pension-2025.azurewebsites.net/api/get-transaction-data?type=${type}`
      );
      
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      
      const data = await response.json();
      
      if (data && data.data) {
        // Transform and filter the data
        const monthIndex = MONTHS.indexOf(selectedMonth) + 1;
        const monthYear = `${monthIndex.toString().padStart(2, '0')}/${selectedYear}`;
        console.log("Test data 1",data.data)
        console.log("this is category",selectedCategories[0])
        
        const filteredData = data.data.filter((item: any) => {  
          return item.subCategory === selectedCategories[0];
        });
        console.log("this is filtered data",filteredData)
        const transformedData = filteredData
          .map((item: any) => ({
            Division: item.division,
            Subcategory:item.subcategory,
            Description: selectedCategories[0],
            MonthYear: item.date,

            // Cumulative_Target: item.targetThisMonth || 0,
            // Cumulative_Actual_CFY: item.actualThisMonth || 0,
            // Cumulative_Actual_Last_Year: item.actualThisMonthLastYear || 0,
            // Target: item.targetYTDThisMonth || 0,
            // Actual_CFY: item.actualYTDThisMonth || 0,
            // Actual_Last_Year: item.actualYTDThisMonthLastYear || 0


            Cumulative_Target: item.targetYTDThisMonth || 0,
            Cumulative_Actual_CFY: item.actualYTDThisMonth || 0,
            Cumulative_Actual_Last_Year: item.actualYTDThisMonthLastYear || 0,
            Target: item.targetThisMonth || 0,
            Actual_CFY: item.actualThisMonth || 0,
            Actual_Last_Year: item.actualThisMonthLastYear || 0
          }))
          .filter((item: any) => {
            const [itemMonth, itemYear] = item.MonthYear.split('/');
            const itemDate = new Date(parseInt(itemYear), parseInt(itemMonth) - 1);
            const fromDateObj = new Date(parseInt(fromYear), parseInt(fromMonth) - 1);
            const toDateObj = new Date(parseInt(toYear), parseInt(toMonth) - 1);
            return (itemDate >= fromDateObj && itemDate <= toDateObj);
          });
          console.log("Test data 2",transformedData)
        
        // If no data found for a division in the date range, add zero data
        const allData = [...transformedData];
        selecteddivisionsName.forEach(division => {
          const hasData = transformedData.some((item: any) => item.Division === division);
          if (!hasData) {
            allData.push({
              Division: division,
              Description: selectedCategories[0],
              MonthYear: fromDate,
              Cumulative_Target: 0,
              Cumulative_Actual_CFY: 0,
              Cumulative_Actual_Last_Year: 0,
              Target: 0,
            });
          }
        });
        
        // console.log('Final variance data:', allData);
        return { data: allData };
      }
      
      return { data: [] };
    } catch (error) {
      console.error('Error in fetchVarianceData:', error);
      throw error;
    }
  };

  const processVarianceChartData = (
    varianceData: any[],
    selecteddivisionsName: string[],
    selectedCategories: string[],
    selectedMetrics: string[],
    getDivisionName: (division: string) => string
  ) => {
    // Get all months in the selected range
    const fromDate = new Date(parseInt(fromYear), MONTHS.indexOf(fromMonth));
    const toDate = new Date(parseInt(toYear), MONTHS.indexOf(toMonth));
    const labels: string[] = [];
    const monthIndices: number[] = [];
    
    let currentDate = new Date(fromDate);
    while (currentDate <= toDate) {
      labels.push(MONTHS[currentDate.getMonth()]);
      monthIndices.push(currentDate.getMonth() + 1);
      currentDate.setMonth(currentDate.getMonth() + 1);
    }
    
    // Calculate NWR totals for each metric
    const nwrTotals = new Map<string, number[]>();
    selectedMetrics.forEach(metric => {
      nwrTotals.set(metric, Array(labels.length).fill(0));
    });

    const datasets = selecteddivisionsName.flatMap((division) => {
      const divisionName = getDivisionName(division);
      
      return selectedCategories.flatMap((category) => {
        return selectedMetrics.map((metric) => {
          // Initialize data array with zeros for all months in range
          const data = Array(labels.length).fill(0);
          
          // Process variance data
          varianceData.forEach((item) => {
            if (item.Division === division && item.Description === category) {
              const [month, year] = item.MonthYear.split("/");
              const itemDate = new Date(parseInt(year), parseInt(month) - 1);
              
              // Find the index of this month in our labels array
              const monthIndex = labels.findIndex((_, i) => {
                const labelDate = new Date(
                  parseInt(fromYear),
                  MONTHS.indexOf(fromMonth) + i
                );
                return (
                  labelDate.getMonth() === itemDate.getMonth() &&
                  labelDate.getFullYear() === itemDate.getFullYear()
                );
              });

              if (monthIndex !== -1) {
                let value = 0;
                if (metric === "Target" && item.Target !== undefined) {
                  value = item.Target;
                } else if ((metric === "Actual" || metric === "Current Year") && item.Actual_CFY !== undefined) {
                  value = item.Actual_CFY;
                } else if (metric === "Last Year" && item.Actual_Last_Year !== undefined) {
                  value = item.Actual_Last_Year;
                }
                
                data[monthIndex] = value;
                // Add to NWR totals
                const currentTotal = nwrTotals.get(metric) || Array(labels.length).fill(0);
                currentTotal[monthIndex] += value;
                nwrTotals.set(metric, currentTotal);
              }
            }
          });
          
          // Set color based on division
          let color = "";
          if (division === "Jaipur") {
            color = "#FF6F61";
          } else if (division === "Jodhpur") {
            color = "#FFA500";
          } else if (division === "Ajmer") {
            color = "#88B04B";
          } else if (division === "Bikaner") {
            color = "#6B5B95";
          }
          
          return {
            label: `${divisionName} - ${category} - ${metric}`,
            data: data,
            borderColor: color,
            backgroundColor: color,
            borderWidth: 2,
          };
        });
      });
    });
    
    // Add NWR datasets if showNWR is true
    if (showNWR) {
      selectedCategories.forEach(category => {
        selectedMetrics.forEach(metric => {
          const nwrData = nwrTotals.get(metric) || Array(labels.length).fill(0);
          datasets.push({
            label: `NWR - ${category} - ${metric}`,
            data: nwrData,
            borderColor: "rgba(255, 255, 255, 0.8)",
            backgroundColor: "rgba(255, 255, 255, 0.8)",
            borderWidth: 3,
            borderDash: [5, 5],
          } as DatasetType);
        });
      });
    }

    const chartData = {
      labels,
      datasets,
    };
    
    return chartData;
  };

  const chartData = processVarianceChartData(
    varianceData,
    selecteddivisionsName,
    selectedCategories,
    selectedMetrics,
    getDivisionName
  );

  const handleFromMonthChange = (event: any) => {
    setFromMonth(event.target.value);
  };

  const handleFromYearChange = (event: any) => {
    setFromYear(event.target.value);
  };

  const handleToMonthChange = (event: any) => {
    setToMonth(event.target.value);
  };

  const handleToYearChange = (event: any) => {
    setToYear(event.target.value);
  };

  // Add NWR checkbox handler
  const handleNWRChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setShowNWR(event.target.checked);
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100%', 
      width: '100%',
      overflow: 'auto',
      '& ::-webkit-scrollbar': {
        width: '0px',
        height: '0px',
      },
      '& ::-webkit-scrollbar-track': {
        background: 'transparent',
      },
      '& ::-webkit-scrollbar-thumb': {
        background: 'transparent',
      },
      '& ::-webkit-scrollbar-corner': {
        background: 'transparent',
      },
      '& *': {
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
      }
    }}>
      <Box display="flex" justifyContent="center" mb={1} mt={1}>
        <ToggleButtonGroup
          value={view}
          exclusive
          onChange={handleViewChange}
          color="primary"
          size="small"
          sx={{
            '& .MuiToggleButton-root': {
              color: 'white',
              borderColor: 'rgba(255, 255, 255, 0.3)',
              '&.Mui-selected': {
                backgroundColor: 'rgba(123, 47, 247, 0.5)',
                color: 'white',
              },
            },
          }}
        >
          <ToggleButton value="data">Data</ToggleButton>
          <ToggleButton value="trend">Trend</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {view === 'data' ? (
        <Box sx={{ 
          width: '100%', 
          height: 'calc(100% - 40px)', 
          padding: '0 8px',
          overflow: 'auto',
          '&::-webkit-scrollbar': {
            width: '0px',
            height: '0px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'transparent',
          },
          '&::-webkit-scrollbar-thumb': {
            background: 'transparent',
          },
          '&::-webkit-scrollbar-corner': {
            background: 'transparent',
          },
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}>
          {/* Month and Year Selection */}
          <Box sx={{ mb: 1, display: 'flex', gap: 2 }}>
            <Select
              value={selectedMonth}
              onChange={handleMonthChange}
              size="small"
              sx={{
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                color: 'white',
                width: '150px',
                '& .MuiSelect-icon': {
                  color: 'white',
                },
              }}
            >
              {MONTHS.map((month) => (
                <MenuItem key={month} value={month}>
                  {month}
                </MenuItem>
              ))}
            </Select>
            <Select
              value={selectedYear}
              onChange={handleYearChange}
              size="small"
              sx={{
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                color: 'white',
                width: '100px',
                '& .MuiSelect-icon': {
                  color: 'white',
                },
              }}
            >
              {YEARS.map((year) => (
                <MenuItem key={year} value={year}>
                  {year}
                </MenuItem>
              ))}
            </Select>
          </Box>

          {/* Metric Selection Radio Buttons */}
          <Box sx={{ mb: 2 }}>
            <RadioGroup
              row
              value={selectedMetric}
              onChange={handleMetricChange}
              sx={{ justifyContent: 'flex-start' }}
            >
              {METRICS.map((metric) => (
                <FormControlLabel
                  key={metric}
                  value={metric}
                  control={
                    <Radio
                      sx={{
                        color: 'rgba(255, 255, 255, 0.7)',
                        '&.Mui-checked': {
                          color: '#7B2FF7',
                        },
                      }}
                    />
                  }
                  label={<Typography color="white" variant="body2" sx={{ fontSize: '0.8rem' }}>{metric}</Typography>}
                  sx={{ mx: 1 }}
                />
              ))}
            </RadioGroup>
          </Box>

          {/* Chart */}
          <Box sx={{ 
            flexGrow: 1, 
            position: 'relative', 
            height: 'calc(100% - 100px)',
            overflow: 'hidden'
          }}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <CircularProgress sx={{ color: 'white' }} />
              </Box>
            ) : error ? (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            ) : performanceData.length === 0 ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <Typography color="white" variant="body1">
                  No data available for {selectedMonth} {selectedYear}
                </Typography>
              </Box>
            ) : (
              <Box sx={{ height: '100%', width: '100%' }}>
                <Bar data={dataChart} options={options} />
              </Box>
            )}
          </Box>
        </Box>
      ) : (
        <Box sx={{ 
          width: '100%', 
          height: 'calc(100% - 40px)', 
          padding: '0 8px',
          overflow: 'auto',
          '&::-webkit-scrollbar': {
            width: '0px',
            height: '0px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'transparent',
          },
          '&::-webkit-scrollbar-thumb': {
            background: 'transparent',
          },
          '&::-webkit-scrollbar-corner': {
            background: 'transparent',
          },
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}>
          {/* Date Range Selection */}
          <Box sx={{ mb: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
            <Typography color="white" variant="body2">From:</Typography>
            <Select
              value={fromMonth}
              onChange={handleFromMonthChange}
              size="small"
              sx={{
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                color: 'white',
                width: '150px',
                '& .MuiSelect-icon': {
                  color: 'white',
                },
              }}
            >
              {MONTHS.map((month) => (
                <MenuItem key={month} value={month}>
                  {month}
                </MenuItem>
              ))}
            </Select>
            <Select
              value={fromYear}
              onChange={handleFromYearChange}
              size="small"
              sx={{
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                color: 'white',
                width: '100px',
                '& .MuiSelect-icon': {
                  color: 'white',
                },
              }}
            >
              {YEARS.map((year) => (
                <MenuItem key={year} value={year}>
                  {year}
                </MenuItem>
              ))}
            </Select>
            <Typography color="white" variant="body2" sx={{ ml: 2 }}>To:</Typography>
            <Select
              value={toMonth}
              onChange={handleToMonthChange}
              size="small"
              sx={{
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                color: 'white',
                width: '150px',
                '& .MuiSelect-icon': {
                  color: 'white',
                },
              }}
            >
              {MONTHS.map((month) => (
                <MenuItem key={month} value={month}>
                  {month}
                </MenuItem>
              ))}
            </Select>
            <Select
              value={toYear}
              onChange={handleToYearChange}
              size="small"
              sx={{
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                color: 'white',
                width: '100px',
                '& .MuiSelect-icon': {
                  color: 'white',
                },
              }}
            >
              {YEARS.map((year) => (
                <MenuItem key={year} value={year}>
                  {year}
                </MenuItem>
              ))}
            </Select>
            <Button
              variant="contained"
              onClick={handleApplyVariance}
              sx={{
                ml: 2,
                backgroundColor: '#7B2FF7',
                '&:hover': {
                  backgroundColor: '#6A1DE0',
                },
              }}
            >
              Apply
            </Button>
          </Box>

          {/* Division Checkboxes */}
          <Box sx={{ mb: 0.5 }}>
            <Grid container spacing={0.3}>
              <Grid item>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={showNWR}
                      onChange={handleNWRChange}
                      sx={{
                        color: "rgba(255, 255, 255, 0.7)",
                        "&.Mui-checked": {
                          color: "#7B2FF7",
                        },
                        padding: "4px",
                      }}
                    />
                  }
                  label={
                    <Typography
                      color="white"
                      variant="body2"
                      sx={{ fontSize: "0.8rem" }}
                    >
                      NWR
                    </Typography>
                  }
                  sx={{ margin: 0 }}
                />
              </Grid>
              {divisionsName.map((division) => (
                <Grid item key={division}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={selecteddivisionsName.includes(division)}
                        onChange={() => handleDivisionChange(division)}
                        sx={{
                          color: "rgba(255, 255, 255, 0.7)",
                          "&.Mui-checked": {
                            color: "#7B2FF7",
                          },
                          padding: "4px",
                        }}
                      />
                    }
                    label={
                      <Typography
                        color="white"
                        variant="body2"
                        sx={{ fontSize: "0.8rem" }}
                      >
                        {division}
                      </Typography>
                    }
                    sx={{ margin: 0 }}
                  />
                </Grid>
              ))}
            </Grid>
          </Box>

          {/* Metric Type Checkboxes */}
          <Box sx={{ mb: 0.5 }}>
            <Grid container spacing={0.2}>
              {["Target", "Actual", "Last Year","CFY YTD Target", "CFY YTD Actual", "LFY YTD Actual", "Variance From Target", "Variance From LFY"].map((metric) => (
                <Grid item key={metric}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={selectedMetrics.includes(metric)}
                        onChange={() => handleMetricTypeChange(metric)}
                        sx={{
                          color: 'rgba(255, 255, 255, 0.7)',
                          '&.Mui-checked': {
                            color: '#7B2FF7',
                          },
                          padding: '4px',
                        }}
                      />
                    }
                    label={<Typography color="white" variant="body2" sx={{ fontSize: '0.8rem' }}>{metric}</Typography>}
                    sx={{ margin: 0 }}
                  />
                </Grid>
              ))}
            </Grid>
          </Box>

          {/* Category Checkboxes */}
          <Box sx={{ mb: 0.5 }}>
            <Grid container spacing={0.2}>
              {METRICS.map((category) => (
                <Grid item key={category}>
                  <FormControlLabel
                    control={
                      <Radio
                        checked={selectedCategories.includes(category)}
                        onChange={() => handleCategoryChange(category)}
                        sx={{
                          color: 'rgba(255, 255, 255, 0.7)',
                          '&.Mui-checked': {
                            color: '#7B2FF7',
                          },
                          padding: '4px',
                        }}
                      />
                    }
                    label={<Typography color="white" variant="body2" sx={{ fontSize: '0.8rem' }}>{category}</Typography>}
                    sx={{ margin: 0 }}
                  />
                </Grid>
              ))}
            </Grid>
          </Box>

          {/* Line Chart */}
          <Box sx={{ 
            flexGrow: 1, 
            position: 'relative', 
            height: 'calc(100% - 200px)',
            overflow: 'hidden'
          }}>
            {varianceLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <CircularProgress sx={{ color: 'white' }} />
              </Box>
            ) : varianceError ? (
              <Alert severity="error" sx={{ mt: 2 }}>
                {varianceError}
              </Alert>
            ) : varianceData.length === 0 ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <Typography color="white" variant="body1">
                  Select options and click Apply to view data
                </Typography>
              </Box>
            ) : (
              <Box sx={{ height: '100%', width: '100%' }}>
                <Bar data={chartData} options={varianceOptions} />
              </Box>
            )}
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default OriginatingEarnings; 