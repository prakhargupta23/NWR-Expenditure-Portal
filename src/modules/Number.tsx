import React, { useState } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Tabs,
  Tab,
  Container,
  Grid,
  Paper,
  Switch,
  TextField,
  IconButton,
  Avatar,
  Box,
  Divider,
} from "@mui/material";
import { Upload, Mic, HelpOutline } from "@mui/icons-material";

import { Chart, registerables } from "chart.js";
import AiChat from "../modules/AiChat";
import TrendChat from "../modules/TrendChat";
import PieChart from "../modules/PieChart";

export default function Number() {
  return (
    <Grid
      item
      xs={12}
      md={3}
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "97%",
      }}
    >
      <Paper elevation={3} sx={{ flex: 1 }}>
        <Box
          sx={{
            width: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            marginTop: "10%",
          }}
        >
          <Divider
            sx={{ width: "100%", height: 1, backgroundColor: "#B3B3B3" }}
          />
          {/* Header with Switch */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 2,
              width: "95%",
              marginTop: 2,
            }}
          >
            <Typography
              variant="h6"
              sx={{ color: "#8075FF", fontWeight: "bold" }}
            >
              Numbers
            </Typography>
            <Switch defaultChecked />
          </Box>

          <Divider
            sx={{ width: "100%", height: 1, backgroundColor: "#B3B3B3" }}
          />
        </Box>
      </Paper>
    </Grid>
  );
}
