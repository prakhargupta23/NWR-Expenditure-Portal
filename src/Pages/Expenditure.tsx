import React, { useState } from "react";
import { Box, Grid, ButtonGroup, Button } from "@mui/material";
import ExpenditureBar from "../modules/ExpenditureBar";
import LeftDocumentSection from "../modules/LeftDocumentSection";
import DocumentUpload from "../modules/Documentupload";
import AiChat from "../modules/AiChat";
import Review from "../modules/Review"

export default function Expenditure() {
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [openCsvModal, setOpenCsvModal] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'dashboard' | 'document' | 'review'>('document');

  return (
    <div
      style={{
        width: "100vw",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#101319",
        alignItems: "center",
        overflow: "auto"
      }}
    >
      <ExpenditureBar 
        extraButton={false}
        deleteLoading={deleteLoading}
        setdeleteModalOpen={setDeleteModalOpen}
        setOpenCsvModal={setOpenCsvModal}
      />
      {/* Tab Switcher */}
      <Box sx={{
        width: '95%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        mt: 2,
        mb: 2,
      }}>
        <ButtonGroup variant="contained" sx={{ boxShadow: 'none' }}>
          <Button
            onClick={() => setSelectedTab('dashboard')}
            sx={{
              background: selectedTab === 'dashboard' ? 'linear-gradient(90deg, #7B2FF7, #9F44D3)' : '#23263a',
              color: 'white',
              fontWeight: 600,
              borderRadius: '8px 0 0 8px',
              boxShadow: 'none',
              textTransform: 'none',
              borderRight: '1px solid #444',
              '&:hover': {
                background: 'linear-gradient(90deg, #7B2FF7, #9F44D3)',
              },
            }}
          >
            Dashboard
          </Button>
          <Button
            onClick={() => setSelectedTab('document')}
            sx={{
              background: selectedTab === 'document' ? 'linear-gradient(90deg, #7B2FF7, #9F44D3)' : '#23263a',
              color: 'white',
              fontWeight: 600,
              borderRadius: 0,
              boxShadow: 'none',
              textTransform: 'none',
              borderRight: '1px solid #444',
              '&:hover': {
                background: 'linear-gradient(90deg, #7B2FF7, #9F44D3)',
              },
            }}
          >
            Document Upload
          </Button>
          <Button
            onClick={() => setSelectedTab('review')}
            sx={{
              background: selectedTab === 'review' ? 'linear-gradient(90deg, #7B2FF7, #9F44D3)' : '#23263a',
              color: 'white',
              fontWeight: 600,
              borderRadius: '0 8px 8px 0',
              boxShadow: 'none',
              textTransform: 'none',
              '&:hover': {
                background: 'linear-gradient(90deg, #7B2FF7, #9F44D3)',
              },
            }}
          >
            Review Check
          </Button>
        </ButtonGroup>
      </Box>
      {/* Main Content Section */}
      <Box
        sx={{
          width: "95%",
          minHeight: "calc(100vh - 78px - 64px)", // Subtracts AppBar and tab height from total height
          marginTop: "0px",
          marginBottom: "20px",
        }}
      >
        <Grid
          container
          spacing={2}
          sx={{
            minHeight: "100%",
            display: "flex",
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "flex-start",
            paddingBottom: "10px",
          }}
        >
          {/* Left Section (Documents) */}
          {selectedTab === 'document' && (
            <Grid
              item
              xs={12}
              md={12}
              sx={{
                display: "flex",
                flexDirection: "column",
                minHeight: "100%",
              }}
            >
              <DocumentUpload />
            </Grid>
          )}
          {/* Dashboard Section */}
          {selectedTab === 'dashboard' && (
            <Grid
              item
              xs={12}
              md={12}
              sx={{
                display: "flex",
                flexDirection: "column",
                minHeight: "100%",
                justifyContent: 'center',
                alignItems: 'center',
                color: 'white',
                fontSize: '1.5rem',
                fontWeight: 600,
              }}
            >
              Dashboard (Coming Soon)
            </Grid>
          )}
          {/* Review Check Section */}
          {selectedTab === 'review' && (
            <Grid
              item
              xs={12}
              md={12}
              sx={{
                display: "flex",
                flexDirection: "column",
                minHeight: "100%",
                justifyContent: 'center',
                alignItems: 'center',
                color: 'white',
                
              }}
            >
              <LeftDocumentSection />
            </Grid>
          )}
        </Grid>
      </Box>
    </div>
  );
}