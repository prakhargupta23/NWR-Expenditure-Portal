import React from "react";
import {
  Box, Card, CardContent, Typography, Grid, Avatar, List, ListItem,
  ListItemIcon, ListItemText, Divider, Chip, Stack
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

// Chart Data
const chartData = [
  { name: "Mon", uv: 400, pv: 2400, amt: 2400 },
  { name: "Tue", uv: 300, pv: 1398, amt: 2210 },
  { name: "Wed", uv: 200, pv: 9800, amt: 2290 },
  { name: "Thu", uv: 278, pv: 3908, amt: 2000 },
  { name: "Fri", uv: 189, pv: 4800, amt: 2181 },
  { name: "Sat", uv: 239, pv: 3800, amt: 2500 },
  { name: "Sun", uv: 349, pv: 4300, amt: 2100 },
];

const pieData = [
  { name: "Approved", value: 400 },
  { name: "Pending", value: 300 },
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

const lineData = [
  { name: 'Jan', documents: 40, reviews: 24, approvals: 20 },
  { name: 'Feb', documents: 30, reviews: 13, approvals: 22 },
  { name: 'Mar', documents: 20, reviews: 98, approvals: 22 },
  { name: 'Apr', documents: 27, reviews: 39, approvals: 20 },
  { name: 'May', documents: 18, reviews: 48, approvals: 21 },
  { name: 'Jun', documents: 23, reviews: 38, approvals: 25 },
  { name: 'Jul', documents: 34, reviews: 43, approvals: 21 },
];

const stackedBarData = [
  { name: 'Q1', Approved: 400, Pending: 240, Rejected: 100 },
  { name: 'Q2', Approved: 300, Pending: 139, Rejected: 80 },
  { name: 'Q3', Approved: 200, Pending: 980, Rejected: 50 },
  { name: 'Q4', Approved: 278, Pending: 390, Rejected: 40 },
];

export default function Dashboard() {
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
      <Box sx={{ width: '100%', maxWidth: 1300, background: '#fff', borderRadius: 5, boxShadow: 6, p: 0, display: 'flex', flexDirection: { xs: 'column', md: 'row' }, overflow: 'hidden' }}>
        
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
        <Box sx={{ flex: 1, p: 4, background: 'linear-gradient(135deg, #f5f7fa 60%, #c3cfe2 100%)', minHeight: 400 }}>
          <Grid container spacing={3}>

            {/* Pie Chart 1 */}
            <Grid item xs={12} md={5}>
              <Card sx={{ borderRadius: 3, boxShadow: 3, mb: 4, height: 350, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, textAlign: 'center', fontSize: '1rem' }}>Document Status Breakdown</Typography>
                  <PieChart width={140} height={140}>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="100%"
                      outerRadius={35}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      // labelStyle={{ fontSize: '0.7rem' }}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Legend wrapperStyle={{ fontSize: '0.7rem' }} iconSize={5} />
                  </PieChart>
                </CardContent>
              </Card>
            </Grid>

            {/* Bar + Line Chart */}
            <Grid item xs={12} md={7}>
              <Card sx={{ borderRadius: 3, boxShadow: 3, p: 5, mb: 0, height: 270 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, fontSize: '1rem' }}>Weekly Activity (Bar + Line)</Typography>
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
                <CardContent>
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
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 0, fontSize: '1rem' }}>Monthly Trends (Line Chart)</Typography>
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

            {/* Stacked Bar */}
            <Grid item xs={12}>
              <Card sx={{ borderRadius: 3, boxShadow: 3, p: 5, height: 270 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 0, fontSize: '1rem' }}>Quarterly Status Overview (Stacked Bar)</Typography>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={stackedBarData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip wrapperStyle={{ fontSize: '0.8rem' }} />
                      <Legend wrapperStyle={{ fontSize: '0.7rem' }} iconSize={10} />
                      <Bar dataKey="Approved" stackId="a" fill="#00C49F" />
                      <Bar dataKey="Pending" stackId="a" fill="#8884d8" />
                      <Bar dataKey="Rejected" stackId="a" fill="#FF8042" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>

            {/* Profile */}
            <Grid item xs={12} md={4}>
              <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Profile</Typography>
                  <Stack direction="row" spacing={1} alignItems="center" justifyContent="center" mb={1}>
                    <Chip label="Active" color="success" size="small" />
                    <Chip label="Premium" color="primary" size="small" />
                  </Stack>
                  <Typography variant="body2" color="#888" align="center">Welcome to your dashboard!</Typography>
                </CardContent>
              </Card>
            </Grid>

          </Grid>
        </Box>
      </Box>
    </Box>
  );
}
