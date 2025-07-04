import React from "react";
import { Box, Card, CardContent, Typography, Grid, Chip, LinearProgress, Avatar, List, ListItem, ListItemAvatar, ListItemText, Stack } from "@mui/material";
import { PieChart, Pie, Cell, BarChart, Bar, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";

const chartData = [
  { name: "0.00 pm", uv: 1200, pv: 2200 },
  { name: "2.00 pm", uv: 2500, pv: 3200 },
  { name: "4.07 pm", uv: 5000, pv: 4200 },
  { name: "5.00 pm", uv: 2000, pv: 3000 },
  { name: "6.00 pm", uv: 1500, pv: 2000 },
  { name: "7.00 pm", uv: 1000, pv: 1500 },
  { name: "8.00 pm", uv: 900, pv: 1200 },
  { name: "9.00 pm", uv: 800, pv: 1000 },
  { name: "10.00 pm", uv: 700, pv: 900 },
  { name: "11.00 pm", uv: 600, pv: 800 },
  { name: "1 am", uv: 500, pv: 700 },
];

const pieData = [
  { name: "Parent", value: 32 },
  { name: "2%", value: 28 },
  { name: "Check", value: 20 },
  { name: "7 ash", value: 20 }
];

const donutData = [
  { name: "Passed", value: 1 },
  { name: "Other", value: 99 }
];

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

export default function BillsDashboard() {
  return (
    <Box p={4} sx={{ color: "#fff", minHeight: "100vh", borderRadius: 3 }}>
      <Grid container spacing={4}>
        {/* Left: Chart Section */}
        <Grid item xs={12} md={8}>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 700, letterSpacing: 1 }}>Bills</Typography>
          <Box sx={{ borderRadius: 3, p: 3, backdropFilter: "blur(8px)" }}>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData} barCategoryGap="10%">
                <XAxis dataKey="name" stroke="#fff" fontSize={12} />
                <YAxis stroke="#fff" fontSize={12} />
                <Tooltip contentStyle={{ background: '#23263a', border: 'none', color: '#fff' }} />
                <Legend wrapperStyle={{ color: '#fff' }} />
                <Bar dataKey="uv" fill="#4CAF50" barSize={18} name="Bills waited" />
                <Line type="monotone" dataKey="pv" stroke="#E040FB" strokeWidth={2} name="Test bills voting approved" />
              </BarChart>
            </ResponsiveContainer>
            <Box display="flex" alignItems="center" gap={2} mt={2}>
              <Chip label="Bills waited" sx={{ bgcolor: "#4CAF50", color: "#fff", fontWeight: 600 }} size="small" />
              <Chip label="Test bills voting approved" sx={{ bgcolor: "#E040FB", color: "#fff", fontWeight: 600 }} size="small" />
              <Box flex={1} />
              <Chip label="42%" sx={{ bgcolor: "#23263a", color: "#fff" }} size="small" />
              <Chip label="10%" sx={{ bgcolor: "#23263a", color: "#fff" }} size="small" />
              <Chip label="Show waiting" sx={{ bgcolor: "#F44336", color: "#fff" }} size="small" />
              <Chip label="Polling Partner" sx={{ bgcolor: "#00C49F", color: "#fff" }} size="small" />
              <Chip label="Bills line Sapper" sx={{ bgcolor: "#0088FE", color: "#fff" }} size="small" />
            </Box>
          </Box>
        </Grid>

        {/* Right: Cards Section */}
        <Grid item xs={12} md={4}>
          <Stack spacing={3}>
            {/* Post-Login Card */}
            <Card sx={{color: "#fff", borderRadius: 3, backdropFilter: "blur(8px)" }}>
              <CardContent>
                <Typography variant="h6" fontWeight={700}>Post-Logine upmited</Typography>
                <Typography variant="body2" mb={1}>
                  Total tasks: These they're going to will post self-logistic.
                </Typography>
                <Box display="flex" alignItems="center" mb={1}>
                  <Chip label="2" color="success" size="small" />
                  <Typography variant="body2" ml={1}>30%</Typography>
                </Box>
                <LinearProgress variant="determinate" value={30} sx={{ height: 8, borderRadius: 5, bgcolor: '#23263a' }} />
                <Box mt={2} display="flex" justifyContent="center">
                  <PieChart width={120} height={120}>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={30}
                      outerRadius={55}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </Box>
                <Typography variant="caption" color="#aaa">Normalizing Train</Typography>
                <Typography variant="caption" color="#aaa" display="block">
                  To increase recall of logins in context, each user will be shown relevant work from a data science company.
                </Typography>
              </CardContent>
            </Card>

            {/* Bills Passed Card */}
            <Card sx={{ color: "#fff", borderRadius: 3, backdropFilter: "blur(8px)" }}>
              <CardContent>
                <Typography variant="h6" fontWeight={700}>Bills Passed</Typography>
                <Box display="flex" justifyContent="center" alignItems="center">
                  <PieChart width={100} height={100}>
                    <Pie
                      data={donutData}
                      cx="50%"
                      cy="50%"
                      innerRadius={35}
                      outerRadius={45}
                      fill="#00C49F"
                      dataKey="value"
                    >
                      <Cell fill="#00C49F" />
                      <Cell fill="#23263a" />
                    </Pie>
                  </PieChart>
                  <Typography variant="h4" fontWeight={900} ml={-7} color="#fff">1%</Typography>
                </Box>
                <Typography variant="caption" color="#aaa">Total summary</Typography>
                <Typography variant="caption" color="#aaa" display="block">
                  Total bills, several today. This is a dummy summary.
                </Typography>
              </CardContent>
            </Card>

            {/* Dashboard Card */}
            <Card sx={{ color: "#fff", borderRadius: 3, backdropFilter: "blur(8px)" }}>
              <CardContent>
                <Typography variant="h6" fontWeight={700}>Dashooad</Typography>
                <Box display="flex" gap={1} mb={1}>
                  <Chip label="AI" color="secondary" size="small" />
                  <Chip label="3" color="primary" size="small" />
                  <Chip label="1" color="success" size="small" />
                </Box>
                <Typography variant="body2" color="#aaa">Desingooad Phases</Typography>
                <List dense>
                  <ListItem>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: "#00C49F", width: 32, height: 32, fontSize: 16 }}>01</Avatar>
                    </ListItemAvatar>
                    <ListItemText primary={<Typography color="#fff">Aquais Tis</Typography>} />
                  </ListItem>
                  <ListItem>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: "#0088FE", width: 32, height: 32, fontSize: 16 }}>02</Avatar>
                    </ListItemAvatar>
                    <ListItemText primary={<Typography color="#fff">Agity Give</Typography>} />
                  </ListItem>
                  <ListItem>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: "#FFBB28", width: 32, height: 32, fontSize: 16 }}>03</Avatar>
                    </ListItemAvatar>
                    <ListItemText primary={<Typography color="#fff">Pueris Gome</Typography>} />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
}
