import React, { useState } from "react";
import LogoutIcon from "@mui/icons-material/Logout";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Avatar,
  Box,
  CircularProgress,
  Drawer,
  useMediaQuery,
  Tooltip,
  Menu,
  MenuItem,
} from "@mui/material";
import "../Home.css";
import { Upload, Download, Menu as MenuIcon } from "@mui/icons-material";
import DeleteIcon from "@mui/icons-material/Delete";
import { useNavigate } from "react-router-dom";
import { userSubject } from "../services/user.service";
import TransactionModal from "./TransactionModel";
import DownloadSheetsDoc from "./SheetDataDownload";
import PDFUploadButton from "./UploadPdf";

interface TopAppBarProps {
  setDeleteModalOpen: (open: boolean) => void;
  deleteLoading: boolean;
  setOpenCsvModal: (open: boolean) => void;
  setCsvToUpload: (type: string) => void;
  setOpen: (open: boolean) => void;
  csvDownloading: boolean;
  downloadCsvData: () => void;
  openPromptModal: boolean;
  setOpenPromptModal: (open: boolean) => void;
  extraButton: boolean;
  reloadGraph: boolean;
  setReloadGraph: any;
}

export default function TopAppBar({
  deleteLoading,
  setDeleteModalOpen,
  setOpenCsvModal,
  setCsvToUpload,
  setOpen,
  csvDownloading,
  downloadCsvData,
  setOpenPromptModal,
  openPromptModal,
  extraButton,
  reloadGraph,
  setReloadGraph,
}: TopAppBarProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const isSmallScreen = useMediaQuery("(max-width: 888px)");

  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const useLogout = () => {
    // Clear specific items or everything
    localStorage.removeItem("user"); // Or whatever key you used
    localStorage.removeItem("token"); // Optional: remove other stuff
    // localStorage.clear(); // Clear everything (optional)
    // Clear the BehaviorSubject
    userSubject.next(null);

    // Redirect to home page or login
    navigate("/login");
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  // function handlePfaPage() {
  //   handleClose();

  //   navigate("/pfa");
  // }

  function handlePensionDashboardPage() {
    handleClose();

    navigate("/dashboard");
  }
  const menuItems = [
    // { id: "pfa", label: "PFA", onClick: handlePfaPage },
    {
      id: "pension",
      label: "Pension Dashboard",
      onClick: handlePensionDashboardPage,
    },
  ];

  const renderMenuItems = () => {
    // If the user is admin, render all menu items
    return menuItems.map((item) => (
      <MenuItem key={item.id} id={item.id} onClick={item.onClick}>
        {item.label}
      </MenuItem>
    ));
  };
  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    console.log("called");

    setAnchorEl(event.currentTarget);
  };

  return (
    <>
      <AppBar
        position="static"
        sx={{
          backgroundColor: "#101319",
          height: "88px",
          display: "flex",
          flexDirection: "row",
          justifyContent: "center",
          alignItems: "center",
          width: "100%",
          borderBottom: "1px solid rgba(255, 255, 255, 0.1)", // Soft, subtle border
          // marginTop: "30px",
        }}
      >
        <Toolbar
          sx={{
            display: "flex",
            justifyContent: "space-between",
            width: "100%",
            height: "100%",
          }}
        >
          {/* Left Side - Logo */}
          <Box sx={{ display: "flex", alignItems: "center" }}>
            {!isSmallScreen && (
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    color: "white",
                    fontWeight: 600,
                    fontSize: "24px",
                    fontFamily: "MyCustomFont,SourceSerif4_18pt",
                    textTransform: "none",
                  }}
                >
                  NWR Finance & Accounts
                </Typography>
                <Typography
                  variant="h6"
                  sx={{
                    color: "white",
                    fontWeight: 600,
                    fontSize: "14px",
                    fontFamily: "MyCustomFont,SourceSerif4_18pt",
                    textTransform: "none",
                  }}
                >
                  AI Dashboard
                </Typography>
              </Box>
            )}
          </Box>

          {/* Right Side - Buttons */}
          {isSmallScreen ? (
            // Menu Button for Small Screens
            <IconButton
              sx={{ color: "white" }}
              onClick={() => setDrawerOpen(true)}
            >
              <MenuIcon />
            </IconButton>
          ) : (
            // Normal Layout for Larger Screens
            <Box sx={{ display: "flex", alignItems: "center" }}>
              {extraButton === false ? (
                <>
                  {deleteLoading ? (
                    <IconButton sx={{ color: "white" }}>
                      <CircularProgress size={24} />
                    </IconButton>
                  ) : (
                    <IconButton
                      onClick={() => setDeleteModalOpen(true)}
                      sx={{ color: "white" }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  )}
                  <Button
                    variant="contained"
                    startIcon={<Upload />}
                    sx={{
                      backgroundColor: "#222633",
                      color: "white",
                      "&:hover": { backgroundColor: "#222633" },
                      border: "1.5px solid rgba(255, 255, 255, 0.1)", // Soft, subtle border
                      borderRadius: "12px",
                      p: "12px",
                      fontSize: "16px",
                      fontFamily: "MyCustomFont,SourceSerif4_18pt",
                      textTransform: "none",
                      marginX: 1,
                    }}
                    onClick={() => setOpenCsvModal(true)}
                  >
                    NWR Master
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<Upload />}
                    sx={{
                      backgroundColor: "#222633",
                      color: "white",
                      "&:hover": { backgroundColor: "#222633" },
                      border: "1.5px solid rgba(255, 255, 255, 0.1)", // Soft, subtle border
                      borderRadius: "12px",
                      p: "12px",
                      fontSize: "16px",
                      fontFamily: "MyCustomFont,SourceSerif4_18pt",
                      textTransform: "none",
                      marginX: 1,
                    }}
                    onClick={() => {
                      setCsvToUpload("sbi");
                      setOpen(true);
                    }}
                  >
                    Bank Master
                  </Button>
                  {csvDownloading ? (
                    <CircularProgress size={24} sx={{ marginX: 1 }} />
                  ) : (
                    <Tooltip title="Unlinked Entries from SBI Master" arrow>
                      <Button
                        variant="contained"
                        startIcon={<Download />}
                        sx={{
                          backgroundColor: "#222633",
                          color: "white",
                          "&:hover": { backgroundColor: "#222633" },
                          border: "1.5px solid rgba(255, 255, 255, 0.1)", // Soft, subtle border

                          borderRadius: "12px",
                          p: "12px",
                          fontSize: "16px",
                          fontFamily: "MyCustomFont,SourceSerif4_18pt",
                          textTransform: "none",
                          marginX: 1,
                        }}
                        onClick={downloadCsvData}
                      >
                        Unlinked Data
                      </Button>
                    </Tooltip>
                  )}
                </>
              ) : null}
              {extraButton === true ? (
                <>
                  <TransactionModal
                    reloadGraph={reloadGraph}
                    setReloadGraph={setReloadGraph}
                  />
                  <DownloadSheetsDoc />
                  <PDFUploadButton />
                </>
              ) : null}

              <img
                src={require("../assets/logo.png")}
                alt="railway"
                width={50}
                height={50}
                style={{
                  borderRadius: "50%",
                  cursor: "pointer",
                  objectFit: "cover",
                  marginLeft: 8,
                }}
                onClick={handleClick}
              />
              <Tooltip title="Logout From the Portal" arrow>
                <Box
                  sx={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    backgroundColor: "#222633",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    border: "1px solid #3a3f51",
                    transition: "all 0.3s ease",
                    marginLeft: 1,
                  }}
                  onClick={useLogout}
                >
                  <LogoutIcon sx={{ color: "white", fontSize: 20 }} />
                </Box>
              </Tooltip>
            </Box>
          )}
        </Toolbar>
      </AppBar>
      <Menu
        anchorEl={anchorEl}
        id="account-menu"
        open={open}
        onClose={handleClose}
        onClick={handleClose}
      >
        {renderMenuItems()}
      </Menu>
      {/* Drawer for Small Screens */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      >
        <Box
          sx={{
            width: 250,
            padding: 2,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          {deleteLoading ? (
            <IconButton sx={{ color: "black" }}>
              <CircularProgress size={24} />
            </IconButton>
          ) : (
            <IconButton onClick={() => setDeleteModalOpen(true)}>
              <DeleteIcon />
            </IconButton>
          )}

          <Button
            variant="contained"
            startIcon={<Upload />}
            sx={{
              marginY: 1,
              width: "100%",
              fontFamily: "MyCustomFont,SourceSerif4_18pt",
              textTransform: "none",
            }}
            onClick={() => setOpenCsvModal(true)}
          >
            NWR Master
          </Button>

          <Button
            variant="contained"
            startIcon={<Upload />}
            sx={{
              marginY: 1,
              width: "100%",
              fontFamily: "MyCustomFont,SourceSerif4_18pt",
              textTransform: "none",
            }}
            onClick={() => {
              setCsvToUpload("sbi");
              setOpen(true);
            }}
          >
            Bank Master
          </Button>
          {csvDownloading ? (
            <CircularProgress size={24} sx={{ marginY: 1 }} />
          ) : (
            <Tooltip title="Download Unlinked Data as CSV" arrow>
              <span style={{ width: "100%" }}>
                {" "}
                {/* This is important! */}
                <Button
                  variant="contained"
                  startIcon={<Download />}
                  sx={{
                    marginY: 1,
                    width: "100%", // Optional: move width control here or keep it on span
                    fontFamily: "MyCustomFont,SourceSerif4_18pt",
                    textTransform: "none",
                  }}
                  onClick={downloadCsvData}
                >
                  Unlinked Data
                </Button>
              </span>
            </Tooltip>
          )}

          {/* <Avatar sx={{ backgroundColor: "#555", marginY: 2 }} /> */}
          {/* <SettingsIcon
            onClick={() => setOpenPromptModal(!openPromptModal)}
            sx={{ cursor: "pointer" }}
          /> */}
          <Tooltip title="Logout From the Portal" arrow>
            <Box
              sx={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                backgroundColor: "#222633",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                border: "1px solid #3a3f51",
                transition: "all 0.3s ease",
              }}
              onClick={useLogout}
            >
              <LogoutIcon sx={{ color: "white", fontSize: 20 }} />
            </Box>
          </Tooltip>
        </Box>
      </Drawer>
    </>
  );
}
