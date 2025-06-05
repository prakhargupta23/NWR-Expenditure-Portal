import React, { useState } from "react";
import { Box, Grid } from "@mui/material";
import ExpenditureBar from "../modules/ExpenditureBar";
import LeftDocumentSection from "../modules/LeftDocumentSection";
import AiChat from "../modules/AiChat";

export default function Expenditure() {
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [openCsvModal, setOpenCsvModal] = useState(false);

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#101319",
        alignItems: "center",
        overflow: "hidden"
      }}
    >
      <ExpenditureBar 
        extraButton={false}
        deleteLoading={deleteLoading}
        setdeleteModalOpen={setDeleteModalOpen}
        setOpenCsvModal={setOpenCsvModal}
      />
      
      {/* Main Content Section */}
      <Box
        sx={{
          width: "95%",
          height: "calc(100% - 78px)", // Subtracts AppBar height from total height
          marginTop: "20px",
        }}
      >
        <Grid
          container
          spacing={2}
          sx={{
            height: "100%",
            display: "flex",
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
            paddingBottom: "10px",
          }}
        >
          {/* Left Section (Documents) */}
          <Grid
            item
            xs={12}
            md={7}
            sx={{
              display: "flex",
              flexDirection: "column",
              height: "100%",
            }}
          >
            <LeftDocumentSection />
          </Grid>
          
          {/* Right Section (AI Chat) */}
          <Grid
            item
            xs={12}
            md={5}
            sx={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              height: "100%",
            }}
          >
            <AiChat pageName="pension" />
          </Grid>
        </Grid>
      </Box>
    </div>
  );
}