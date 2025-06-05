import React,{useState} from "react";
import LogoutIcon from "@mui/icons-material/Logout";
import { AppBar,Toolbar,Typography,Button,IconButton,Box,CircularProgress,Drawer,useMediaQuery,Tooltip,Menu,MenuItem } from "@mui/material";
import "../Home.css";
import { Upload, Download, Menu as MenuIcon } from "@mui/icons-material";
import DeleteIcon from "@mui/icons-material/Delete";
import PDFUploadButton from "./Expenditurepdf";

import { userSubject } from "../services/user.service";
import { useNavigate } from "react-router-dom";


interface ExpenditureBarProps{
    extraButton:boolean,
    deleteLoading:boolean,
    setdeleteModalOpen:(open:boolean)=>void,
    setOpenCsvModal:(open:boolean)=>void,
}

export default function ExpenditureBar({
    extraButton,
    deleteLoading,
    setdeleteModalOpen,
    setOpenCsvModal,

}:ExpenditureBarProps){
    const isSmallScreen = useMediaQuery("(max-width: 888px)");
    const [drawerOpen, setDrawerOpen] = useState(false);
    const navigate = useNavigate();

    const useLogout = () => {
        localStorage.removeItem("user"); 
        localStorage.removeItem("token"); 
        userSubject.next(null);
        navigate("/login");
      };

    return(
        <>
        <AppBar position="static"
        sx={{
            backgroundColor:"#101319",
            height: "88px",
            display: "flex",
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
            width: "100%",
            borderBottom: "1px solid rgba(255, 255, 255, 0.1)"
        }}
        >
            <Toolbar
            sx={{
                display: "flex",
                justifyContent:"space-between",
                width: "100%",
                height: "100%",
            }}>
                {/* Left side */}
                <Box sx ={{display: "flex", alignItems: "center"}}>
                    {!isSmallScreen && (
                        <Box sx={{
                            display:"flex",
                            flexDirection: "column",
                            alignItems: "flex-start"
                        }}>
                            <Typography variant="h6"
                            sx={{
                                color: "white",
                                fontWeight: 600,
                                fontSize: "24px",
                                fontFamily: "MyCustomFont,SourceSerif4_18pt",
                                textTransform: "none",
                            }}>Expenditure Dashboard</Typography>
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
                {/* Right side */}
                {isSmallScreen?(
                    <IconButton
                    sx={{color: "white"}}
                    onClick={()=>setDrawerOpen(true)}
                    ><MenuIcon/></IconButton>
                ):(
                    <Box sx={{display:"flex",alignItems: "center"}}>
{/*                         {extraButton === false ? (
                            <>
                            {deleteLoading ? (
                                <IconButton sx={{color:"white"}}>
                                    <CircularProgress size={24} />
                                </IconButton>
                            ):(
                                <IconButton
                                onClick={() => setdeleteModalOpen(true)}
                                sx={{color:"white"}}>
                                    <DeleteIcon />
                                </IconButton>
                            )}
                            <PDFUploadButton />
                            </>
                        ):null} */}
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

        
        </>
    )
}
