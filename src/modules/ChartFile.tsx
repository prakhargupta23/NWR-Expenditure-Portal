import React, { useState, useEffect } from "react";
import {
  CircularProgress,
  Typography,
  Paper,
  Box,
  Tab,
  Tabs,
  Grid,
} from "@mui/material";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";

const COLORS = ["#0088FE", "#FF8042", "#00C49F"]; // Blue = Overpayment, Orange = Underpayment, Green = No Change

interface ChartProps {
  arpanData: any[]; // Assuming arpanData is the data you're getting
  loadingData: boolean;
}

const DashboardChart: React.FC<ChartProps> = ({ arpanData, loadingData }) => {
  const [totalOverpayment, setTotalOverpayment] = useState(0);
  const [totalUnderpayment, setTotalUnderpayment] = useState(0);
  const [totalNoChange, setTotalNoChange] = useState(0);
  const [paymentPieData, setPaymentPieData] = useState([
    { name: "Overpayment", value: 0 },
    { name: "Underpayment", value: 0 },
    { name: "No Change", value: 0 },
  ]);
  const [tabValue, setTabValue] = useState(0); // Default tab is Payment Pie

  useEffect(() => {
    if (arpanData.length > 0) {
      // Calculate overpayment, underpayment, and no change
      const overpayment = arpanData.reduce(
        (sum, item) => (item.basicDiff > 0 ? sum + item.basicDiff : sum),
        0
      );
      const underpayment = arpanData.reduce(
        (sum, item) =>
          item.basicDiff < 0 ? sum + Math.abs(item.basicDiff) : sum,
        0
      );
      const noChange = arpanData.reduce(
        (sum, item) => (item.basicDiff === 0 ? sum + 1 : sum),
        0
      ); // Counting number of "No Change" payments

      setTotalOverpayment(overpayment);
      setTotalUnderpayment(underpayment);
      setTotalNoChange(noChange);

      // Update Pie data with three categories
      setPaymentPieData([
        { name: "Overpayment", value: overpayment },
        { name: "Underpayment", value: underpayment },
        { name: "No Change", value: noChange },
      ]);
    }
  }, [arpanData]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const getTotalAmount = (amount: number) => {
    return amount.toFixed(2); // Format total amount to 2 decimal places
  };

  // Function to calculate percentage
  const getPercentage = (value: number) => {
    const total = totalOverpayment + totalUnderpayment + totalNoChange;
    return total > 0 ? ((value / total) * 100).toFixed(2) + "%" : "0%";
  };

  return (
    <Paper
      elevation={4}
      sx={{
        width: "90%",
        height: "100%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        borderRadius: 3,
        boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.2)",
        backgroundColor: "#fff",
        position: "relative",
      }}
    >
      {loadingData ? (
        <CircularProgress />
      ) : arpanData.length === 0 ? (
        <Typography variant="h6" sx={{ color: "#555" }}>
          No Data Available
        </Typography>
      ) : (
        <>
          <Box sx={{ width: "100%" }}>
            {/* Tabs for switching between different pie chart types */}
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              aria-label="chart tabs"
            >
              <Tab label="Payment Pie" />
              <Tab label="Other Data" />
            </Tabs>

            {/* Content for the active tab */}
            <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
              {tabValue === 0 && (
                // Payment Pie Chart
                <ResponsiveContainer width="70%" height={400}>
                  <PieChart>
                    <Pie
                      data={paymentPieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={130}
                      label={({ name, value }) =>
                        `${name}: ${getPercentage(value)}`
                      } // Show percentage inside the pie chart
                    >
                      {paymentPieData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: any, name) => [
                        `Amount: ${getTotalAmount(value)}`,
                        name,
                      ]}
                      wrapperStyle={{
                        backgroundColor: "#fff",
                        borderRadius: 6,
                        padding: 10,
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}

              {tabValue === 1 && (
                // Placeholder for "Other Data" tab content
                <Box sx={{ display: "flex", justifyContent: "center" }}>
                  <Typography variant="h6" sx={{ color: "#555" }}>
                    Other Data Visualization Here
                  </Typography>
                </Box>
              )}
            </Box>

            {/* Legend for Colors */}
            <Grid
              container
              spacing={2}
              sx={{ mt: 2, justifyContent: "center" }}
            >
              <Grid item>
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <Box
                    sx={{
                      width: 16,
                      height: 16,
                      backgroundColor: COLORS[0],
                      marginRight: 1,
                    }}
                  ></Box>
                  <Typography>Overpayment</Typography>
                </Box>
              </Grid>
              <Grid item>
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <Box
                    sx={{
                      width: 16,
                      height: 16,
                      backgroundColor: COLORS[1],
                      marginRight: 1,
                    }}
                  ></Box>
                  <Typography>Underpayment</Typography>
                </Box>
              </Grid>
              <Grid item>
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <Box
                    sx={{
                      width: 16,
                      height: 16,
                      backgroundColor: COLORS[2],
                      marginRight: 1,
                    }}
                  ></Box>
                  <Typography>No Change</Typography>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </>
      )}
    </Paper>
  );
};

export default DashboardChart;
