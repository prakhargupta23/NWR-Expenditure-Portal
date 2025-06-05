import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  TextField,
  Snackbar,
  CircularProgress,
  Container, // ✅ Imported from Material-UI
} from "@mui/material";
import SettingsIcon from "@mui/icons-material/Settings";
import { Formik, Form } from "formik";
import { aiService } from "../services/ai.service";

interface DynamicFormModalInterface {
  openPromptModal: boolean;
  setOpenPromptModal: (type: boolean) => void;
}

const DynamicFormModal = ({
  openPromptModal,
  setOpenPromptModal,
}: DynamicFormModalInterface) => {
  const [formData, setFormData] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [propmtLoading, setPromptLoading] = useState(false);
  const fetchData = async () => {
    setPromptLoading(true);
    try {
      const cachebusterAndroid = Math.floor(Math.random() * 100) + 1;
      const response = await fetch(
        `https://reshapestorage.blob.core.windows.net/reshape-public/railway.json?cachebuster=${cachebusterAndroid}`
      );
      if (!response.ok) throw new Error("Failed to fetch data");
      const data = await response.json();
      setFormData(data);
    } catch (error) {
      console.error("Error fetching data:", error);
      setSnackbarMessage("Error fetching data");

      setSnackbarOpen(true);
    } finally {
      setPromptLoading(false);
    }
  };
  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (values: any) => {
    try {
      setLoading(true);
      console.log("Submitting updated values:", values);
      let response = await aiService.updateAiPrompt(values);
      if (response.success) {
        setSnackbarMessage("Prompt updated successfully!");

        setSnackbarOpen(true);
        setOpenPromptModal(false);
      } else {
        setSnackbarMessage(response.message);

        setSnackbarOpen(true);
        setOpenPromptModal(false);
      }
    } catch (error) {
      console.error("Error updating prompt:", error);
      setSnackbarMessage("Error updating prompt");

      setSnackbarOpen(true);
    } finally {
      setLoading(false);
      fetchData();
    }
  };
  return (
    <>
      <Dialog
        open={openPromptModal}
        onClose={() => setOpenPromptModal(false)}
        fullWidth
        maxWidth="xl" // ✅ Bigger modal
      >
        <DialogTitle>Edit Data</DialogTitle>
        <DialogContent sx={{ padding: 3 }}>
          {propmtLoading ? (
            <Container
              sx={{
                width: "100%",
                display: "flex",
                flexDirection: "row",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <CircularProgress />
            </Container>
          ) : (
            <>
              {formData ? (
                <Formik initialValues={formData} onSubmit={handleSubmit}>
                  {({ values, handleChange }) => (
                    <Form>
                      {Object.keys(values).map((key) => (
                        <TextField
                          key={key}
                          name={key}
                          label={key}
                          fullWidth
                          multiline // ✅ Large input field
                          minRows={5} // ✅ More space inside input
                          variant="outlined"
                          margin="normal"
                          value={values[key]}
                          onChange={handleChange}
                        />
                      ))}
                      {loading ? (
                        <Container
                          sx={{
                            width: "100%",
                            display: "flex",
                            flexDirection: "row",
                            justifyContent: "center",
                            alignItems: "center",
                          }}
                        >
                          <CircularProgress />
                        </Container>
                      ) : (
                        <Button
                          type="submit"
                          variant="contained"
                          color="primary"
                        >
                          Save
                        </Button>
                      )}
                    </Form>
                  )}
                </Formik>
              ) : (
                "Loading..."
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPromptModal(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        message={snackbarMessage}
        onClose={() => setSnackbarOpen(false)}
      ></Snackbar>
    </>
  );
};

export default DynamicFormModal;
