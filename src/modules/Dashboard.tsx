import React, { useEffect, useState } from "react";
import {
  Box, Card, CardContent, Typography, Grid, Avatar, List, ListItem,
  ListItemIcon, ListItemText, Divider, Chip, Stack, CircularProgress, TextField
} from "@mui/material";
import DashboardIcon from '@mui/icons-material/Dashboard';
import BarChartIcon from '@mui/icons-material/BarChart';
import PieChartIcon from '@mui/icons-material/PieChart';
// import SettingsIcon from '@mui/icons-material/Settings';
import PersonIcon from '@mui/icons-material/Person';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Line, Legend, LineChart, CartesianGrid
} from "recharts";
import { expenditureService } from "../services/expenditure.service";
// import { takeUntil } from "rxjs";
import { useMemo } from 'react';

// Helper to extract status from row (Status or Remarks.Status)
function extractStatus(row: DocumentRow) {
  let status = row.Status;
  if (row.Remarks) {
    try {
      const remarksObj = JSON.parse(row.Remarks);
      if (remarksObj.Status) status = remarksObj.Status;
    } catch {}
  }
  return (status || '').toLowerCase();
}

// Helper to extract amount from row
function extractAmount(row: DocumentRow) {
  return parseFloat((row.TotalAmt || '').toString().replace(/,/g, '')) || 0;
}

// Helper to extract date from Created field
function extractCreatedDate(row: DocumentRow) {
  if (!row.Created) return null;
  try {
    // Handle both string and Date formats
    const dateStr = String(row.Created);
    // If it's already a date string like 20250716819:16.248Z"
    if (dateStr.includes('T')) return new Date(dateStr);
    
    // If it's in DD/MM/YYYY format
    if(dateStr.includes('/')) {
      const [datePart] = dateStr.split(',');
      const [day, month, year] = datePart.split('/').map(Number);
      return new Date(year, month - 1, day);
    }
    return new Date(dateStr);
  } catch (error) {
    console.error('Error parsing Created date:', error, row.Created);
    return null;
  }
}

// Get start of week (Sunday)
function getStartOfWeek(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay());
  return d;
}


const pieData = [
  { name: "Approved", value: 400 },
  { name: "Rejected", value: 200 },
  { name: "In Review", value: 100 },
];



const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

// Function to generate monthly data for current year from backend
function getMonthlyDataFromBackend(rows: DocumentRow[]): Array<{ name: string; documents: number; reviews: number; approvals: number }> {
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];
  
  const currentYear = new Date().getFullYear();
  
  // Initialize monthly data structure
  const monthlyData = months.map((month, index) => ({
    name: month,
    documents: 0,
    reviews: 0,
    approvals: 0
  }));
  console.log('yeardata',rows,monthlyData)
  // Process backend data to count documents by month
  rows.forEach((row: DocumentRow) => {
    if (!row.Created) return;
    
    try {
      const [datePart] = String(row.Created).split(','); // "10/07/2025"
      const [day, month, year] = datePart.split('/').map(Number);
      const documentDate = new Date(year, month - 1, day); // JS months are 0-indexed
      
      // Check if this document is from the current year
      if (documentDate.getFullYear() === currentYear) {
        const monthIndex = documentDate.getMonth(); // 0 = January, 1 = February, etc.
        
        if (monthIndex >= 0 && monthIndex < monthlyData.length) {
          // Count as document
          monthlyData[monthIndex].documents += 1;
          
          // If document has a status, count as review
          if (row.Status) {
            monthlyData[monthIndex].reviews += 1;
            
            // If status is approved, count as approval
            if (row.Status.toLowerCase() === 'approved') {
              monthlyData[monthIndex].approvals += 1;
            }
          }
        }
      }
    } catch (error) {
      console.error('Error processing document date for monthly data:', error);
    }
  });
  
  return monthlyData;
}



const stackedBarData = [
  { name: 'Q1', Approved: 400, Rejected: 100 },
  { name: 'Q2', Approved: 300, Rejected: 80 },
  { name: 'Q3', Approved: 200, Rejected: 50 },
  { name: 'Q4', Approved: 278, Rejected: 40 },
];

interface DocumentRow {
  SNo: number | string;           // BIGINT in DB, may come as string from backend
  Status?: string | null;
  PONo?: string | null;
  Consignee?: string | null;
  InvoiceNo?: string | null;
  InvoiceDate?: string | null;
  RNoteNo?: string | null;
  QtyAccepted?: string | null;
  TotalAmt?: string | null;
  Security?: string | null;
  Remarks?: string | null;
  Created?: string | Date | null;
  IREPSNo?: string | null; // Added IREPSNo
}

function getRowsFromCurrentMonth(rows: DocumentRow[]): DocumentRow[] {
  console.log("oafkldnvsc",rows)
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  console.log("oafkldnvsc")
  const data = rows.filter((row: DocumentRow) => {
    
    if (!row.Created) return false;
    console.log("oafkldnvsc6432879")
    const [datePart] = String(row.Created).split(','); // "10/07/2025"
    const [day, month, year] = datePart.split('/').map(Number);
    const date = new Date(year, month - 1, day); // JS months are 0-indexed

    return (
      date.getMonth() === currentMonth &&
      date.getFullYear() === currentYear
    );
  });
  console.log("dsalk",data)
  return data;
}




export default function Dashboard() {
  // Add default date variables at the top of the component
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const defaultTo = `${yyyy}-${mm}-${dd}`;
  const defaultFrom = `${yyyy}-${mm}-01`;

  const [statusCounts, setStatusCounts] = useState([
    { name: "Approved", count: 0 },
    { name: "Rejected", count: 0 },
    { name: "Pending", count: 0 },
    { name: "Total", count: 0 }
  ]);
  const [chartData, setChartData] = useState([
    { name: "Sun", uv: 0, pv: 0, amt: 0 },
    { name: "Mon", uv: 0, pv: 0, amt: 0 },
    { name: "Tue", uv: 0, pv: 0, amt: 0 },
    { name: "Wed", uv: 0, pv: 0, amt: 0 },
    { name: "Thu", uv: 0, pv: 0, amt: 0 },
    { name: "Fri", uv: 0, pv: 0, amt: 0 },
    { name: "Sat", uv: 0, pv: 0, amt: 0 },
  ]);
  const [lineData, setLineData] = useState([
    { name: 'Jan', documents: 0, reviews: 0, approvals: 0 },
    { name: 'Feb', documents: 0, reviews: 0, approvals: 0 },
    { name: 'Mar', documents: 0, reviews: 0, approvals: 0 },
    { name: 'Apr', documents: 0, reviews: 0, approvals: 0 },
    { name: 'May', documents: 0, reviews: 0, approvals: 0 },
    { name: 'Jun', documents: 0, reviews: 0, approvals: 0 },
    { name: 'Jul', documents: 0, reviews: 0, approvals: 0 },
    { name: 'Aug', documents: 0, reviews: 0, approvals: 0 },
    { name: 'Sep', documents: 0, reviews: 0, approvals: 0 },
    { name: 'Oct', documents: 0, reviews: 0, approvals: 0 },
    { name: 'Nov', documents: 0, reviews: 0, approvals: 0 },
    { name: 'Dec', documents: 0, reviews: 0, approvals: 0 },
  ]);
  const [pieData2, setPieData2] = useState([
    { name: "Approved Amount", value: 0 },
    { name: "Rejected Amount", value: 0 },
  ]);
  const [loading, setLoading] = useState(true);

  // 1. Add new state for monthly amount trends
  const [lineAmountData, setLineAmountData] = useState([
    { name: 'Jan', approved: 0, rejected: 0, total: 0 },
    { name: 'Feb', approved: 0, rejected: 0, total: 0 },
    { name: 'Mar', approved: 0, rejected: 0, total: 0 },
    { name: 'Apr', approved: 0, rejected: 0, total: 0 },
    { name: 'May', approved: 0, rejected: 0, total: 0 },
    { name: 'Jun', approved: 0, rejected: 0, total: 0 },
    { name: 'Jul', approved: 0, rejected: 0, total: 0 },
    { name: 'Aug', approved: 0, rejected: 0, total: 0 },
    { name: 'Sep', approved: 0, rejected: 0, total: 0 },
    { name: 'Oct', approved: 0, rejected: 0, total: 0 },
    { name: 'Nov', approved: 0, rejected: 0, total: 0 },
    { name: 'Dec', approved: 0, rejected: 0, total: 0 },
  ]);

  // 1. Add state for date range and filtered data
  const [fromDate, setFromDate] = useState(defaultFrom);
  const [toDate, setToDate] = useState(defaultTo);
  const [allRows, setAllRows] = useState<DocumentRow[]>([]); // Store all data rows

  // Update the filtered data computation to include all chart data
  const filteredRows = useMemo(() => {
    if (!allRows.length) return [];
    const from = new Date(fromDate);
    const to = new Date(toDate);
    to.setHours(23,59,59,999);
    return allRows.filter((row) => {
      const date = extractCreatedDate(row);
      return date && date >= from && date <= to;
    });
  }, [allRows, fromDate, toDate]);

  // 3. Compute filtered chart data based on date range
  const filteredStatusCounts = useMemo(() => {
    let approved = 0, rejected = 0, pending = 0;
    let approvedAmount = 0, rejectedAmount = 0;
    
    filteredRows.forEach((row) => {
      const status = extractStatus(row);
      const amt = extractAmount(row);
      
      if (status === "approved") {
        approved++;
        approvedAmount += amt;
      } else if (status === "rejected") {
        rejected++;
        rejectedAmount += amt;
      } else if (status === "pending") {
        pending++;
      }
    });
    
    return {
      statusCounts: [
        { name: "Approved", count: approved },
        { name: "Rejected", count: rejected },
        { name: "Pending", count: pending },
        { name: "Total", count: filteredRows.length }
      ],
      pieData2: [
        { name: "Approved Amount", value: approvedAmount },
        { name: "Rejected Amount", value: rejectedAmount },
      ]
    };
  }, [filteredRows]);

  // 4. Compute filtered monthly data
  const filteredMonthlyData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyData = months.map(month => ({ name: month, documents: 0, reviews: 0, approvals: 0 }));
    const monthlyAmountData = months.map(month => ({ name: month, approved: 0, rejected: 0, total: 0 }));
    
    filteredRows.forEach((row) => {
      const status = extractStatus(row);
      const amt = extractAmount(row);
      const date = extractCreatedDate(row);
      
      if (date) {
        const monthIdx = date.getMonth();
        if (monthIdx >= 0 && monthIdx < monthlyData.length) {
          monthlyData[monthIdx].documents += 1;
          if (status !== "pending") monthlyData[monthIdx].reviews += 1;
          if (status === "approved") monthlyData[monthIdx].approvals += 1;
          
          // Amount trends
          if (status === "approved") monthlyAmountData[monthIdx].approved += amt;
          if (status === "rejected") monthlyAmountData[monthIdx].rejected += amt;
          monthlyAmountData[monthIdx].total += amt;
        }
      }
    });
    
    return { monthlyData, monthlyAmountData };
  }, [filteredRows]);

  const currentWeekData = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weekData = days.map((day) => ({ name: day, uv: 0, pv: 0, amt: 0 }));
    if (!allRows.length) return weekData;
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
    allRows.forEach((row) => {
      const status = extractStatus(row);
      const date = extractCreatedDate(row);
      if (!date) return;
      if (date >= startOfWeek && date <= endOfWeek) {
        const dayIdx = date.getDay();
        if (dayIdx >= 0 && dayIdx < weekData.length) {
          weekData[dayIdx].uv += 1;
          if (status !== "pending") weekData[dayIdx].pv += 1;
          weekData[dayIdx].amt = weekData[dayIdx].uv + weekData[dayIdx].pv;
        }
      }
    });
    return weekData;
  }, [allRows]);


  async function fetchDashboardData() {
    setLoading(true);
    try {
      const res = await expenditureService.getGstInvoiceData();
      let data = res.data || [];
      // Remove rows with IREPSNo null
      data = data.filter((row: DocumentRow) => row.IREPSNo != null);
      data = data.filter((row: DocumentRow) => row.Status != 'pending');
      // Filter to unique IREPSNo (first occurrence)
      const seen = new Set();
      data = data.filter((row: DocumentRow) => {
        console.log("ireps",row.IREPSNo)
        if (seen.has(row.IREPSNo)) return false;
        seen.add(row.IREPSNo);
        console.log("new added")
        return true;
      });
      console.log("unique data",data,seen)
      // Status counts
      let approved = 0, rejected = 0, pending = 0;
      let approvedAmount = 0, rejectedAmount = 0;
      // Weekly data
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const today = new Date();
      const startOfWeek = getStartOfWeek(today);
      console.log("week",today,startOfWeek)
      const weekData = days.map((day, i) => ({ name: day, uv: 0, pv: 0, amt: 0 }));
      console.log("week data",weekData)
      // Monthly data
      const months = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
      ];
      const currentYear = today.getFullYear();
      const monthlyData = months.map((month, i) => ({ name: month, documents: 0, reviews: 0, approvals: 0 }));

      // 2. In fetchDashboardData, compute monthly approved, rejected, and total amounts
      const monthlyAmountData = months.map((month, i) => ({ name: month, approved: 0, rejected: 0, total: 0 }));

      data.forEach((row: DocumentRow) => {
        const status = extractStatus(row);
        const amt = extractAmount(row);
        const date = extractCreatedDate(row); // Use Created date instead of InvoiceDate
        
        console.log('Processing row:', row);
        console.log(
          'IREPSNo:', row.IREPSNo, 
          status, 
          amt, 
          'date:', date?.toISOString(),
          'created:', row.Created 
        );
        
        // Status counts
        if (status === "approved") {
          approved++;
          approvedAmount += amt;
        } else if (status === "rejected") {
          rejected++;
          rejectedAmount += amt;
        } else if (status === "pending") {
          pending++;
        }
        
        // Weekly data (current week)
        if (date) {
          const weekStart = new Date(startOfWeek);
          const weekEnd = new Date(startOfWeek);
          weekEnd.setDate(weekStart.getDate() + 6);
          
          if (date >= weekStart && date <= weekEnd) {
            const dayIdx = date.getDay();
            if (dayIdx >= 0 && dayIdx < weekData.length) {
              weekData[dayIdx].uv += 1; // All uploads
              if (status !== "pending") weekData[dayIdx].pv += 1; // Reviews (not pending)
              weekData[dayIdx].amt = weekData[dayIdx].uv + weekData[dayIdx].pv;
              console.log(`Added to week day ${dayIdx} (${days[dayIdx]}):`, { uv: weekData[dayIdx].uv, pv: weekData[dayIdx].pv });
            }
          }
        }
        
        // Monthly data (current year)
        if (date && date.getFullYear() === currentYear) {
          const monthIdx = date.getMonth();
          if (monthIdx >= 0 && monthIdx < monthlyData.length) {
            monthlyData[monthIdx].documents += 1;
            if (status !== "pending") monthlyData[monthIdx].reviews += 1;
            if (status === "approved") monthlyData[monthIdx].approvals += 1;
            console.log(`Added to month ${monthIdx} (${months[monthIdx]}):`, { 
              documents: monthlyData[monthIdx].documents, 
              reviews: monthlyData[monthIdx].reviews, 
              approvals: monthlyData[monthIdx].approvals 
            });
          }
          // Amount trends
          if (status === "approved") monthlyAmountData[monthIdx].approved += amt;
          if (status === "rejected") monthlyAmountData[monthIdx].rejected += amt;
          monthlyAmountData[monthIdx].total += amt;
        }
      });
      
      console.log('Final weekly data:', weekData);
      console.log('Final monthly data:', monthlyData);
      setStatusCounts([
        { name: "Approved", count: approved },
        { name: "Rejected", count: rejected },
        { name: "Pending", count: pending },
        { name: "Total", count: data.length }
      ]);
      setPieData2([
        { name: "Approved Amount", value: approvedAmount },
        { name: "Rejected Amount", value: rejectedAmount },
      ]);
      setChartData(weekData);
      setLineData(monthlyData);
      setLineAmountData(monthlyAmountData);
      setAllRows(data); // Store all data
    } catch (e) {
      setStatusCounts([
        { name: "Approved", count: 0 },
        { name: "Rejected", count: 0 },
        { name: "Pending", count: 0 },
        { name: "Total", count: 0 }
      ]);
      setPieData2([
        { name: "Approved Amount", value: 0 },
        { name: "Rejected Amount", value: 0 },
      ]);
      setChartData([
        { name: "Sun", uv: 0, pv: 0, amt: 0 },
        { name: "Mon", uv: 0, pv: 0, amt: 0 },
        { name: "Tue", uv: 0, pv: 0, amt: 0 },
        { name: "Wed", uv: 0, pv: 0, amt: 0 },
        { name: "Thu", uv: 0, pv: 0, amt: 0 },
        { name: "Fri", uv: 0, pv: 0, amt: 0 },
        { name: "Sat", uv: 0, pv: 0, amt: 0 },
      ]);
      setLineData([
        { name: 'Jan', documents: 0, reviews: 0, approvals: 0 },
        { name: 'Feb', documents: 0, reviews: 0, approvals: 0 },
        { name: 'Mar', documents: 0, reviews: 0, approvals: 0 },
        { name: 'Apr', documents: 0, reviews: 0, approvals: 0 },
        { name: 'May', documents: 0, reviews: 0, approvals: 0 },
        { name: 'Jun', documents: 0, reviews: 0, approvals: 0 },
        { name: 'Jul', documents: 0, reviews: 0, approvals: 0 },
        { name: 'Aug', documents: 0, reviews: 0, approvals: 0 },
        { name: 'Sep', documents: 0, reviews: 0, approvals: 0 },
        { name: 'Oct', documents: 0, reviews: 0, approvals: 0 },
        { name: 'Nov', documents: 0, reviews: 0, approvals: 0 },
        { name: 'Dec', documents: 0, reviews: 0, approvals: 0 },
      ]);
      setLineAmountData([
        { name: 'Jan', approved: 0, rejected: 0, total: 0 },
        { name: 'Feb', approved: 0, rejected: 0, total: 0 },
        { name: 'Mar', approved: 0, rejected: 0, total: 0 },
        { name: 'Apr', approved: 0, rejected: 0, total: 0 },
        { name: 'May', approved: 0, rejected: 0, total: 0 },
        { name: 'Jun', approved: 0, rejected: 0, total: 0 },
        { name: 'Jul', approved: 0, rejected: 0, total: 0 },
        { name: 'Aug', approved: 0, rejected: 0, total: 0 },
        { name: 'Sep', approved: 0, rejected: 0, total: 0 },
        { name: 'Oct', approved: 0, rejected: 0, total: 0 },
        { name: 'Nov', approved: 0, rejected: 0, total: 0 },
        { name: 'Dec', approved: 0, rejected: 0, total: 0 },
      ]);
      setAllRows([]); // Clear all rows on error
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return (
    <Box sx={{ width: '100%', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', mt: 5, p: 0, border: "1px solid rgba(255, 255, 255, 0)", }}>
      {/* Header */}
      {/* <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', mb: 2 }}>
        <Avatar sx={{ bgcolor: '#fff', color: '#222', width: 120, height: 120, boxShadow: 2, m: 5  }}>
          <DashboardIcon fontSize="large" />
        </Avatar>
        <Typography variant="h1" sx={{ fontWeight: 700, fontSize: '2.2rem', ml: 1 }}>
          Dashboard
        </Typography>
      </Box>
      <hr style={{ border: '1px solid rgba(255, 255, 255, 1)', width: '100%' }} /> */}
      

      {/* Main Card */}
      <Box sx={{ width: '100%', maxWidth: 1300, background: 'rgba(0,0,0,0)', borderRadius: 5, boxShadow: 6, p: 0, display: 'flex', flexDirection: { xs: 'column', md: 'row' }, overflow: 'hidden' }}>
        
        {/* Sidebar */}
        <Box sx={{ width: { xs: '100%', md: 220 }, background: 'linear-gradient(135deg, #23263a 60%, #4f5b93 100%)', color: '#fff', p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: 400 }}>
          <Avatar sx={{ width: 64, height: 64, mb: 0, bgcolor: '#00C49F' }}><PersonIcon fontSize="large" /></Avatar>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>Dashboards</Typography>
          <Typography variant="body2" sx={{ color: '#bdbdbd', mb: 2 }}>Admin</Typography>
          <Divider sx={{ width: '100%', mb: 2, bgcolor: 'rgba(255,255,255,0.1)' }} />
          <List>
            <ListItem button selected>
              <ListItemIcon sx={{ color: '#fff' }}><DashboardIcon /></ListItemIcon>
              <ListItemText primary="Expenditure Dashboard" />
            </ListItem>
            <ListItem button>
              <ListItemIcon sx={{ color: '#fff' }}><BarChartIcon /></ListItemIcon>
              <ListItemText primary="Analytics Dashboard" />
            </ListItem>
            <ListItem button>
              <ListItemIcon sx={{ color: '#fff' }}><PieChartIcon /></ListItemIcon>
              <ListItemText primary="Reports Dashboard" />
            </ListItem>
            
          </List>
        </Box>

        {/* Main Content */}
        <Box sx={{ flex: 1, p: 4, background: 'rgba(255,255,255,0.1)', minHeight: 400 }}>
          <Grid container spacing={3}>
            {/* Bar + Line Chart - Move this to the top */}
            <Grid item xs={12} md={12}>
              <Card sx={{ borderRadius: 3, boxShadow: 3, p: 5, mb: 0, height: 270 }}>
                <CardContent sx={{ p: 0 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, fontSize: '1rem' }}>Current Week Activity (Bar + Line)</Typography>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={currentWeekData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip wrapperStyle={{ fontSize: '0.8rem' }} />
                      <Legend wrapperStyle={{ fontSize: '0.7rem' }} iconSize={15} />
                      <Bar dataKey="uv" fill="#8884d8" radius={[8, 8, 0, 0]} name="Uploads" />
                      <Line type="monotone" dataKey="pv" stroke="#00C49F" strokeWidth={2} name="Views" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>

            {/* Date Selection - moved after Current Week Activity */}
            <Grid item xs={12} md={12}>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2, color: '#fff' }}>
                 <Typography variant="h6" sx={{ color: '#fff', fontWeight: 700, mr: 2 }}>Filter by Date Range:</Typography>
                  <TextField
                   label="From"
                   type="date"
                   size="small"
                   value={fromDate}
                   onChange={e => setFromDate(e.target.value)}
                   InputLabelProps={{ shrink: true }}
                   sx={{
                     '& .MuiOutlinedInput-root': {
                       color: '#fff',
                       '& fieldset': {
                         borderColor: '#fff',
                       },
                       '&:hover fieldset': {
                         borderColor: '#fff',
                       },
                       '&.Mui-focused fieldset': {
                         borderColor: '#fff',
                       },
                     },
                     '& .MuiInputLabel-root': {
                       color: '#fff',
                     },
                   }}
                 />
                 <TextField
                   label="To"
                   type="date"
                   size="small"
                   value={toDate}
                   onChange={e => setToDate(e.target.value)}
                   InputLabelProps={{ shrink: true }}
                   sx={{
                     '& .MuiOutlinedInput-root': {
                       color: '#fff',
                       '& fieldset': {
                         borderColor: '#fff',
                       },
                       '&:hover fieldset': {
                         borderColor: '#fff',
                       },
                       '&.Mui-focused fieldset': {
                         borderColor: '#fff',
                       },
                     },
                     '& .MuiInputLabel-root': {
                       color: '#fff',
                     },
                   }}
                 />
              </Box>
            </Grid>
            
            {/* Approved */}
            <Grid item xs={12} md={4}>
              <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
                <CardContent>
                  <Stack direction="row" spacing={1} alignItems="center" justifyContent="center" mb={1}>
                    <Chip label="Approved" color="success" size="medium" />
                  </Stack>
                  <Typography variant="h5" color="#4caf50" align="center" fontWeight={700}>
                    {filteredStatusCounts.statusCounts.find(s => s.name === "Approved")?.count ?? 0}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            {/* Total */}
            <Grid item xs={12} md={4}>
              <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
                <CardContent>
                  <Stack direction="row" spacing={1} alignItems="center" justifyContent="center" mb={1}>
                    <Chip label="Total" color="warning" size="medium" />
                  </Stack>
                  <Typography variant="h5" color="#ff9800" align="center" fontWeight={700}>
                    {filteredStatusCounts.statusCounts.find(s => s.name === "Total")?.count ?? 0}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            {/* Rejected */}
            <Grid item xs={12} md={4}>
              <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
                <CardContent>
                  <Stack direction="row" spacing={1} alignItems="center" justifyContent="center" mb={1}>
                    <Chip label="Rejected" color="error" size="medium" />
                  </Stack>
                  <Typography variant="h5" color="#f44336" align="center" fontWeight={700}>
                    {filteredStatusCounts.statusCounts.find(s => s.name === "Rejected")?.count ?? 0}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            {/* Approved Amount */}
            <Grid item xs={12} md={4}>
              <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
                <CardContent>
                  <Stack direction="row" spacing={1} alignItems="center" justifyContent="center" mb={1}>
                    <Chip label="Approved Amount" color="success" size="medium" />
                  </Stack>
                  <Typography variant="h5" color="#4caf50" align="center" fontWeight={700}>
                    ₹{filteredStatusCounts.pieData2.find(s => s.name === "Approved Amount")?.value.toLocaleString() ?? 0}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            {/* Total Amount */}
            <Grid item xs={12} md={4}>
              <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
                <CardContent>
                  <Stack direction="row" spacing={1} alignItems="center" justifyContent="center" mb={1}>
                    <Chip label="Total Amount" color="warning" size="medium" />
                  </Stack>
                  <Typography variant="h5" color="#ff9800" align="center" fontWeight={700}>
                    ₹{(filteredStatusCounts.pieData2.find(s => s.name === "Approved Amount")?.value ?? 0) + (filteredStatusCounts.pieData2.find(s => s.name === "Rejected Amount")?.value ?? 0)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            {/* Rejected Amount */}
            <Grid item xs={12} md={4}>
              <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
                <CardContent>
                  <Stack direction="row" spacing={1} alignItems="center" justifyContent="center" mb={1}>
                    <Chip label="Rejected Amount" color="error" size="medium" />
                  </Stack>
                  <Typography variant="h5" color="#f44336" align="center" fontWeight={700}>
                    ₹{filteredStatusCounts.pieData2.find(s => s.name === "Rejected Amount")?.value.toLocaleString() ?? 0}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            {/* First Pie Chart (Live) */}
            <Grid item xs={12} md={5}>
              <Card sx={{ borderRadius: 3, boxShadow: 3, mb: 4, height: 350, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, textAlign: 'center', fontSize: '1rem' }}>Document Status (Live)</Typography>
                  {loading ? (
                    <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: 200 }}>
                      <CircularProgress />
                    </Box>
                  ) : (
                    <ResponsiveContainer width={200} height={200}>
                      <PieChart>
                        <Pie
                          data={filteredStatusCounts.statusCounts.filter(s => s.name === "Approved" || s.name === "Rejected")}
                          dataKey="count"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={70}
                          label={false}
                        >
                          {filteredStatusCounts.statusCounts.filter(s => s.name === "Approved" || s.name === "Rejected").map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={
                              entry.name === "Approved" ? "#4caf50" :
                              entry.name === "Rejected" ? "#f44336" :
                              "#8884d8"
                            } />
                          ))}
                        </Pie>
                        {/* Custom Tooltip for PieChart */}
                        <Tooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const { name, count } = payload[0].payload;
                              return (
                                <Box sx={{ background: '#fff', p: 1, borderRadius: 1, boxShadow: 2, minWidth: 80 }}>
                                  <Typography variant="subtitle2" sx={{ color: '#222', fontWeight: 700 }}>{name}</Typography>
                                  <Typography variant="body2" sx={{ color: '#222' }}>Count: {count}</Typography>
                                </Box>
                              );
                            }
                            return null;
                          }}
                          cursor={false}
                        />
                        <Legend wrapperStyle={{ fontSize: '0.9rem' }} iconSize={12} />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </Grid>


            {/* Line Chart for Amounts */}
            <Grid item xs={12} md={7}>
              <Card sx={{ borderRadius: 3, boxShadow: 3, p: 5, height: 270 }}>
                <CardContent sx={{ p: 0 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 0, fontSize: '1rem' }}>Current Year Monthly Trends (Amount)</Typography>
                  <ResponsiveContainer width="100%" height={180}>
                    <LineChart data={filteredMonthlyData.monthlyAmountData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip wrapperStyle={{ fontSize: '0.8rem' }} formatter={v => `₹${v.toLocaleString()}`}/>
                      <Legend wrapperStyle={{ fontSize: '0.7rem' }} iconSize={10} />
                      <Line type="monotone" dataKey="approved" stroke="#4caf50" strokeWidth={2} name="Approved Amount" />
                      <Line type="monotone" dataKey="rejected" stroke="#f44336" strokeWidth={2} name="Rejected Amount" />
                      <Line type="monotone" dataKey="total" stroke="#8884d8" strokeWidth={2} name="Total Amount" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>

            

            {/* Pie Chart 2 */}
            <Grid item xs={12} md={5}>
              <Card sx={{ borderRadius: 3, boxShadow: 3, height: 350, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, textAlign: 'center', fontSize: '1rem' }}>Amount Distribution (Approved vs Rejected)</Typography>
                  {loading ? (
                    <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: 200 }}>
                      <CircularProgress />
                    </Box>
                  ) : filteredStatusCounts.pieData2.length > 0 ? (
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={filteredStatusCounts.pieData2}
                          cx="50%"
                          cy="50%"
                          outerRadius={70}
                          fill="#00C49F"
                          dataKey="value"
                          nameKey="name"
                          label={false}
                        >
                          {filteredStatusCounts.pieData2.map((entry, index) => (
                            <Cell key={`cell2-${index}`} fill={
                              entry.name === "Approved Amount" ? "#4caf50" : "#f44336"
                            } />
                          ))}
                        </Pie>
                        <Tooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const { name, value } = payload[0].payload;
                              return (
                                <Box sx={{ background: '#fff', p: 1, borderRadius: 1, boxShadow: 2, minWidth: 120 }}>
                                  <Typography variant="subtitle2" sx={{ color: '#222', fontWeight: 700 }}>{name}</Typography>
                                  <Typography variant="body2" sx={{ color: '#222' }}>Amount: ₹{value.toLocaleString()}</Typography>
                                </Box>
                              );
                            }
                            return null;
                          }}
                          cursor={false}
                        />
                        <Legend wrapperStyle={{ fontSize: '0.8rem' }} iconSize={12} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: 200 }}>
                      <Typography variant="body2" sx={{ color: '#666' }}>No data available</Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Line Chart */}
            <Grid item xs={12} md={7}>
              <Card sx={{ borderRadius: 3, boxShadow: 3, p: 5, height: 270 }}>
                <CardContent sx={{ p: 0 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 0, fontSize: '1rem' }}>Current Year Monthly Trends (Line Chart)</Typography>
                  <ResponsiveContainer width="100%" height={180}>
                    <LineChart data={filteredMonthlyData.monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip wrapperStyle={{ fontSize: '0.8rem' }} />
                      <Legend wrapperStyle={{ fontSize: '0.7rem' }} iconSize={10} />
                      <Line type="monotone" dataKey="documents" stroke="#8884d8" strokeWidth={2} />
                      <Line type="monotone" dataKey="reviews" stroke="#00C49F" strokeWidth={2} />
                      <Line type="monotone" dataKey="approvals" stroke="#FFBB28" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>

            

            

            
            

          </Grid>
        </Box>
      </Box>
    </Box>
  );
}
