import React, { useState } from "react";
import { Box, Grid, ButtonGroup, Button } from "@mui/material";
import ExpenditureBar from "../modules/ExpenditureBar";
import LeftDocumentSection from "../modules/LeftDocumentSection";
import DocumentUpload from "../modules/Documentupload";
import AiChat from "../modules/AiChat";
import Review from "../modules/Review"
import ParticlesBackground from "../modules/ParticleBackground";
import Dashboard from '../modules/Dashboard'
import train from '../assets/Train.png';
import bg1 from '../assets/bg1.jpg';
import bg2 from '../assets/bg2.jpg';
import reviewBg from '../assets/bg2.jpg';
import Expanded from "../modules/expanded";
import type { DocumentRow } from "../modules/Documentupload";

export default function Expenditure() {
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [openCsvModal, setOpenCsvModal] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'dashboard' | 'document' | 'review' | 'expanded'>('dashboard');
  const [expandedRow, setExpandedRow] = useState<DocumentRow | null>(null);

  const getBackground = () => {
    if (selectedTab === 'dashboard') return `url(${bg2}) center center / cover no-repeat `;
    if (selectedTab === 'document') return `url(${bg2}) center center / cover no-repeat `;
    if (selectedTab === 'review') return `url(${bg2}) center center / cover no-repeat `;
    return '#000';
  };

  return (
    <div
      style={{
        width: "100vw",
        maxWidth: "100vw",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background: getBackground(),
        backgroundSize: `${100}% ${100}%`,
        // background: '#000',
        alignItems: "center",
        overflow: "hidden",
        overflowX: "hidden",
        boxSizing: "border-box",
        padding: 0,
        margin: 0,
      }}
    >
      <Box sx={{ ml: '20%',position: 'absolute', left: 0, right: 0, bottom: 100, display: 'flex', justifyContent: 'center', zIndex: 2, pointerEvents: 'none' }}>
        <img src={train} alt="train" style={{ width: 900, opacity: 0.3, color: '#fff', filter: 'brightness(1) invert(1)' }} />
      </Box>
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          zIndex: 0,
          pointerEvents: "none", // so background doesn't block clicks
        }}
      >
        <ParticlesBackground />
      </div>
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
              background: selectedTab === 'dashboard' ? 'linear-gradient(90deg, rgba(54, 249, 220, 1), rgba(54, 249, 220, 1))' : '#23263a',
              color: 'white',
              fontWeight: 600,
              borderRadius: '8px 0 0 8px',
              boxShadow: 'none',
              textTransform: 'none',
              borderRight: '1px solid #444',
              '&:hover': {
                background: 'linear-gradient(90deg, rgba(54, 249, 220, 0.2), rgba(54, 249, 220, 0.5))',
              },
            }}
          >
            Dashboard
          </Button>
          <Button
            onClick={() => setSelectedTab('document')}
            sx={{
              background: selectedTab === 'document' ? 'linear-gradient(90deg, rgba(54, 249, 220, 0.2), rgba(54, 249, 220, 0.5))' : '#23263a',
              color: 'white',
              fontWeight: 600,
              borderRadius: 0,
              boxShadow: 'none',
              textTransform: 'none',
              borderRight: '1px solid #444',
              '&:hover': {
                background: 'linear-gradient(90deg, rgba(54, 249, 220, 0.2), rgba(54, 249, 220, 0.5))',
              },
            }}
          >
            Document Upload
          </Button>
          <Button
            onClick={() => setSelectedTab('review')}
            sx={{
              background: selectedTab === 'review' ? 'linear-gradient(90deg, rgba(54, 249, 220, 0.2), rgba(54, 249, 220, 0.5))' : '#23263a',
              color: 'white',
              fontWeight: 600,
              borderRadius: '0 8px 8px 0',
              boxShadow: 'none',
              textTransform: 'none',
              '&:hover': {
                background: 'linear-gradient(90deg, rgba(54, 249, 220, 0.05), rgba(54, 249, 220, 0.5))',
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
          width: "90%",
          minHeight: "calc(100vh - 78px - 64px)", // Subtracts AppBar and tab height from total height
          marginTop: "0px",
          marginBottom: "10px",
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
              <DocumentUpload onTabChange={setSelectedTab} />
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
              {/* Dashboard (Coming Soon) */}
              <Dashboard/>
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
          {/* expanded section */}
          {expandedRow && (
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
              <Expanded row={expandedRow} onClose={() => setExpandedRow(null)} />
            </Grid>
          )}
        </Grid>
      </Box>
    </div>
  );
}