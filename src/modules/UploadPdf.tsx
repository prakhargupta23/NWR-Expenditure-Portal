import React, { useState, useRef } from "react";
import { Button, CircularProgress, Snackbar, Alert } from "@mui/material";
import UploadIcon from "@mui/icons-material/Upload";
import { BlobServiceClient } from "@azure/storage-blob";
import { userService } from "../services/user.service";

// Replace this with your actual function to get storageAccount and sasToken

// Upload PDF to Azure Blob
async function uploadPDFOnAzure(file: File): Promise<any> {
  try {
    const accountDetails = await userService.getCredentials(); // returns { storageAccount, sasToken, success }

    if (
      !accountDetails.success ||
      !accountDetails.storageAccount ||
      !accountDetails.sasToken
    ) {
      throw new Error("Unable to fetch Azure credentials");
    }

    const storageAccount = accountDetails.storageAccount;
    const sasToken = accountDetails.sasToken;
    const containerName = "nwr";

    const blobName = `pdfs/${Date.now()}-${file.name}`;
    const blobUrl = `https://${storageAccount}.blob.core.windows.net/${containerName}/${blobName}?${sasToken}`;

    const response = await fetch(blobUrl, {
      method: "PUT",
      body: file,
      headers: {
        "x-ms-blob-type": "BlockBlob",
      },
    });
    console.log(response);

    if (response.status === 201) {
      return blobUrl.split("?")[0]; // return clean public URL
    } else {
      console.error(
        "Azure upload failed:",
        response.status,
        await response.text()
      );
      return null;
    }
  } catch (error) {
    console.error("Upload error:", error);
    return null;
  }
}
const uploadPdfToAzure = async (file: File) => {
  const formData = await file.arrayBuffer();

  const res = await fetch(
    "https://<your-function-url>.azurewebsites.net/api/upload-pdf?fileName=" +
      file.name,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/pdf",
        "x-filename": file.name,
      },
      body: formData,
    }
  );

  const result = await res.json();
  console.log(result);
};

const PDFUploadButton: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error";
  }>({ open: false, message: "", severity: "success" });

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      setSnackbar({
        open: true,
        message: "Only PDF files are allowed.",
        severity: "error",
      });
      return;
    }

    setLoading(true);
    try {
      const uploadedUrl = await uploadPDFOnAzure(file);
      console.log(uploadedUrl);

      if (uploadedUrl) {
        setSnackbar({
          open: true,
          message: "PDF uploaded successfully!",
          severity: "success",
        });
      } else {
        setSnackbar({
          open: true,
          message: "Failed to upload PDF.",
          severity: "error",
        });
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: "Failed to upload PDF.",
        severity: "error",
      });
    } finally {
      setLoading(false);
      event.target.value = "";
    }
  };

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <>
      <input
        type="file"
        accept="application/pdf"
        ref={fileInputRef}
        onChange={handleFileChange}
        style={{ display: "none" }}
      />
      <Button
        variant="contained"
        startIcon={
          loading ? (
            <CircularProgress size={20} style={{ color: "#fff" }} />
          ) : (
            <UploadIcon />
          )
        }
        onClick={handleButtonClick}
        disabled={loading}
        sx={{
          backgroundColor: "#222633",
          color: "white",
          "&:hover": { backgroundColor: "#222633" },
          border: "1.5px solid rgba(255, 255, 255, 0.1)",
          borderRadius: "12px",
          p: "12px",
          fontSize: "16px",
          fontFamily: "MyCustomFont,SourceSerif4_18pt",
          textTransform: "none",
          marginX: 1,
        }}
      >
        {loading ? "Uploading..." : "PDF"}
      </Button>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={handleSnackbarClose}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default PDFUploadButton;
