import React, { useEffect, useState } from "react";
import {
  Box, Card, CardContent, Typography, Grid, Avatar, List, ListItem,
  ListItemIcon, ListItemText, Divider, Chip, Stack, CircularProgress
} from "@mui/material";
import DashboardIcon from '@mui/icons-material/Dashboard';
import BarChartIcon from '@mui/icons-material/BarChart';
import PieChartIcon from '@mui/icons-material/PieChart';
import SettingsIcon from '@mui/icons-material/Settings';
import PersonIcon from '@mui/icons-material/Person';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Line, Legend, LineChart, CartesianGrid
} from "recharts";
import { expenditureService } from "../services/expenditure.service";
import { takeUntil } from "rxjs";

// Function to generate current week data from backend
function getCurrentWeekDataFromBackend(rows: DocumentRow[]): Array<{ name: string; uv: number; pv: number; amt: number }> {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const today = new Date();
  const currentDay = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
  
  // Calculate the start of the current week (Sunday)
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - currentDay);
  
  // Initialize data structure for the week
  const weekData = days.map((day, index) => {
    const date = new Date(startOfWeek);
    date.setDate(startOfWeek.getDate() + index);
    
    return {
      name: day,
      uv: 0, // Uploads/New documents
      pv: 0, // Views/Verifications
      amt: 0
    };
  });
  
  // Process backend data to count documents by day
  rows.forEach((row: DocumentRow) => {
    if (!row.VerificationTime) return;
    
    try {
      const [datePart] = row.VerificationTime.split(','); // "10/07/2025"
      const [day, month, year] = datePart.split('/').map(Number);
      const documentDate = new Date(year, month - 1, day); // JS months are 0-indexed
      
      // Check if this document is from the current week
      const weekStart = new Date(startOfWeek);
      const weekEnd = new Date(startOfWeek);
      weekEnd.setDate(startOfWeek.getDate() + 6);
      
      if (documentDate >= weekStart && documentDate <= weekEnd) {
        const dayOfWeek = documentDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
        const dayIndex = dayOfWeek;
        
        if (dayIndex >= 0 && dayIndex < weekData.length) {
          // Count as upload (new document)
          weekData[dayIndex].uv += 1;
          
          // If document has a status, count as verification/view
          if (row.Status) {
            weekData[dayIndex].pv += 1;
          }
          
          weekData[dayIndex].amt = weekData[dayIndex].uv + weekData[dayIndex].pv;
        }
      }
    } catch (error) {
      console.error('Error processing document date:', error);
    }
  });
  
  return weekData;
}



const pieData = [
  { name: "Approved", value: 400 },
  { name: "Rejected", value: 200 },
  { name: "In Review", value: 100 },
];

const pieData2 = [
  { name: "Receipt Note", value: 120 },
  { name: "Tax Invoice", value: 90 },
  { name: "GST Invoice", value: 60 },
  { name: "Other", value: 30 },
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
  
  // Process backend data to count documents by month
  rows.forEach((row: DocumentRow) => {
    if (!row.VerificationTime) return;
    
    try {
      const [datePart] = row.VerificationTime.split(','); // "10/07/2025"
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
  SNo: number;
  ReceiptNote: string | null;
  TaxInvoice: string | null;
  GSTInvoice: string | null;
  ModificationAdvice: string | null;
  InspectionCertificate: string | null;
  PurchaseOrder: string | null;
  Status: string;
  VerificationTime: string;
  AuthorizationCommittee: string;
  Remark: string;
}

function getRowsFromCurrentMonth(rows: DocumentRow[]): DocumentRow[] {
  console.log("oafkldnvsc",rows)
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  console.log("oafkldnvsc")
  const data = rows.filter((row: DocumentRow) => {
    
    if (!row.VerificationTime) return false;
    console.log("oafkldnvsc6432879")
    const [datePart] = row.VerificationTime.split(','); // "10/07/2025"
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
  const [statusCounts, setStatusCounts] = useState([
    { name: "Approved", count: 0 },
    { name: "Rejected", count: 0 },
    { name: "Total", count: 0 }
  ]);
  const [chartData, setChartData] = useState<Array<{ name: string; uv: number; pv: number; amt: number }>>([
    { name: "Sun", uv: 0, pv: 0, amt: 0 },
    { name: "Mon", uv: 0, pv: 0, amt: 0 },
    { name: "Tue", uv: 0, pv: 0, amt: 0 },
    { name: "Wed", uv: 0, pv: 0, amt: 0 },
    { name: "Thu", uv: 0, pv: 0, amt: 0 },
    { name: "Fri", uv: 0, pv: 0, amt: 0 },
    { name: "Sat", uv: 0, pv: 0, amt: 0 },
  ]);
  const [lineData, setLineData] = useState<Array<{ name: string; documents: number; reviews: number; approvals: number }>>([
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
  const [loading, setLoading] = useState(true);


  async function fetchStatusCounts() {
    setLoading(true);
    try {
      const res = await expenditureService.getExpenditureData();
      
      
      // If backend returns { data: [...] }
      const rows: DocumentRow[] = res.data || [];
      const monthdata = getRowsFromCurrentMonth(rows);
      console.log("monthdata",monthdata)
      
      // Generate weekly chart data from backend
      const weeklyData = getCurrentWeekDataFromBackend(rows);
      setChartData(weeklyData);
      console.log("Weekly chart data:", weeklyData);
      
      // Generate monthly chart data from backend
      const monthlyData = getMonthlyDataFromBackend(rows);
      setLineData(monthlyData);
      console.log("Monthly chart data:", monthlyData);
      
      const uniqueCommittees = [...new Set(monthdata.filter(r => r.AuthorizationCommittee).map(r => r.AuthorizationCommittee))];

      const filtered = uniqueCommittees.map(committee => {
        const group = rows.filter(r => r.AuthorizationCommittee === committee);

        const approved = group.find(r => r.Status === "Approved");
        if (approved) return approved;

        const rejected = group.find(r => r.Status === "Rejected");
        return rejected || group[0]; // fallback in case neither Approved nor Rejected
      });

      console.log("dashboard rws",uniqueCommittees)
      console.log("unique",filtered)
      const approved = filtered.filter(r => r.Status === "approved").length;
      const rejected = filtered.filter(r => r.Status === "rejected").length;
      const total = approved + rejected;
      setStatusCounts([
        { name: "Approved", count: approved },
        { name: "Rejected", count: rejected },
        { name: "Total", count: total }
      ]);
    } catch (e) {
      setStatusCounts([
        { name: "Approved", count: 0 },
        { name: "Rejected", count: 0 },
        { name: "Total", count: 0 }
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
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchStatusCounts();
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
            {/* Approved */}
            <Grid item xs={12} md={4}>
              <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
                <CardContent>
                  <Stack direction="row" spacing={1} alignItems="center" justifyContent="center" mb={1}>
                    <Chip label="Approved" color="success" size="medium" />
                  </Stack>
                  <Typography variant="h4" color="#4caf50" align="center" fontWeight={700}>
                    {statusCounts.find(s => s.name === "Approved")?.count ?? 0}
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
                  <Typography variant="h4" color="#ff9800" align="center" fontWeight={700}>
                    {statusCounts.find(s => s.name === "Total")?.count ?? 0}
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
                  <Typography variant="h4" color="#f44336" align="center" fontWeight={700}>
                    {statusCounts.find(s => s.name === "Rejected")?.count ?? 0}
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
                          data={statusCounts}
                          dataKey="count"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={70}
                          label={false}
                        >
                          {statusCounts.map((entry, index) => (
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

            {/* Bar + Line Chart */}
            <Grid item xs={12} md={7}>
              <Card sx={{ borderRadius: 3, boxShadow: 3, p: 5, mb: 0, height: 270 }}>
                <CardContent sx={{ p: 0 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, fontSize: '1rem' }}>Current Week Activity (Bar + Line)</Typography>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={chartData}>
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

            {/* Pie Chart 2 */}
            <Grid item xs={12} md={5}>
              <Card sx={{ borderRadius: 3, boxShadow: 3, height: 350, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <CardContent sx={{ p: 0 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, textAlign: 'center', fontSize: '1rem' }}>Document Type Distribution</Typography>
                  <PieChart width={140} height={140}>
                    <Pie
                      data={pieData2}
                      cx="50%"
                      cy="50%"
                      outerRadius={55}
                      fill="#00C49F"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      // labelStyle={{ fontSize: '0.7rem' }}
                    >
                      {pieData2.map((entry, index) => (
                        <Cell key={`cell2-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Legend wrapperStyle={{ fontSize: '0.7rem' }} iconSize={10} />
                  </PieChart>
                </CardContent>
              </Card>
            </Grid>

            {/* Line Chart */}
            <Grid item xs={12} md={7}>
              <Card sx={{ borderRadius: 3, boxShadow: 3, p: 5, height: 270 }}>
                <CardContent sx={{ p: 0 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 0, fontSize: '1rem' }}>Current Year Monthly Trends (Line Chart)</Typography>
                  <ResponsiveContainer width="100%" height={180}>
                    <LineChart data={lineData}>
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
