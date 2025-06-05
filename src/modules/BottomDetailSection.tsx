import React, { useEffect, useState } from "react";
import {
  Grid,
  Paper,
  Typography,
  CircularProgress,
  Container,
  Divider,
} from "@mui/material";
import "../Home.css";
export default function BottomDetailSection({ loading, summaryData }: any) {
  return (
    <>
      {loading ? (
        <Container
          sx={{
            display: "flex",
            flexDirection: "row",
            width: "100%",
            justifyContent: "center",
            alignItems: "flex-start",
            mt: 1,
          }}
        >
          <CircularProgress />
        </Container>
      ) : (
        <>
          <Grid
            container
            sx={{
              width: "100%",
              display: "flex",
              flexDirection: "row",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            {/* Linked Section */}
            <Grid
              item
              xs={12}
              sx={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "start",

                alignItems: "flex-start",
                padding: 0,
                marginLeft: "24px",
                marginRight: "24px",
              }}
            >
              <Typography
                sx={{
                  fontSize: "14px",
                  fontWeight: "600",
                  marginTop: 0,

                  color: "#fff",
                  fontFamily: "MyCustomFont,SourceSerif4_18pt",
                  textTransform: "none",
                }}
              >
                Linked
              </Typography>
              <Divider
                sx={{
                  height: "1px",
                  backgroundColor: "#FFFFFF", // White color
                  width: "3%", // Full width

                  marginTop: "3px",
                  opacity: 0.6, // Optional: Slight transparency
                }}
              />
            </Grid>

            {/* Card 1 - Net Mismatch */}
            <Grid
              item
              xs={12}
              sx={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "start",

                alignItems: "flex-start",
                padding: 0,
                width: "100%",
              }}
            >
              <Paper
                elevation={1}
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  justifyContent: "center",
                  backgroundColor: "#191F2A",
                  borderRadius: "12px",
                  border: "0.5px solid #222633",
                  minHeight: "60px",
                  marginLeft: 2,
                  width: { lg: "170px", md: "100px" },
                  paddingTop: "12px",
                  paddingLeft: "12px",
                  marginBottom: "12px",
                  marginTop: "6px",
                }}
              >
                <Typography
                  sx={{
                    fontSize: "12px",
                    color: "#fff",
                    fontWeight: 500,
                    fontFamily: "MyCustomFont,SourceSerif4_18pt",
                    textTransform: "none",
                  }}
                >
                  Net Mismatch
                </Typography>
                <Typography
                  sx={{
                    fontSize: "24px",
                    fontWeight: "bold",
                    color: "#fff",
                    mt: 1,

                    fontFamily: "MyCustomFont,SourceSerif4_18pt",
                    textTransform: "none",
                  }}
                >
                  ₹{summaryData?.netMismatch?.toLocaleString() || "N/A"}
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </>
      )}
    </>
  );
}
