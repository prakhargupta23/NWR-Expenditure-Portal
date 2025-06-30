import React, { useState } from "react";
import {
  Paper,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Snackbar,
  Alert,
} from "@mui/material";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import { userService } from "../services/user.service";
import { useNavigate } from "react-router-dom";

// Define form validation schema
const LoginSchema = Yup.object().shape({
  username: Yup.string().required("Username is required"),
  password: Yup.string().required("Password is required"),
});

function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const navigate = useNavigate();
  const handleCloseSnackbar = (event: any, reason: any) => {
    setSnackbarOpen(!snackbarOpen);
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        backgroundColor: "#000", // Black background
      }}
    >
      <Paper
        elevation={6}
        style={{
          padding: "2rem",
          width: "400px",
          textAlign: "center",
          borderRadius: "10px",
          backgroundColor: "#fff", // White card for contrast
        }}
      >
        <Typography
          variant="h4"
          gutterBottom
          style={{ fontWeight: "bold", color: "#000" }}
        >
          Login
        </Typography>
        <Formik
          initialValues={{ username: "", password: "" }}
          validationSchema={LoginSchema}
          onSubmit={async (values, { setSubmitting, resetForm }) => {
            setLoading(true);
            try {
              let response = await userService.login(
                values.username,
                values.password
              );
              console.log(response);

              if (response.success) {
                const { jwt, role, username } = response.data;

                localStorage.setItem("role", role);
                setSnackbarOpen(true);
                setSnackbarMessage("Login successfully");
                navigate("/Expenditure");
              } else {
                setSnackbarOpen(true);
                setSnackbarMessage(`Login unsuccessfull ${response.message}`);
              }
              resetForm();
            } catch (error: any) {
              setSnackbarOpen(false);
              setSnackbarMessage(error.message);
            }
            setLoading(false);
            setSubmitting(false);
          }}
        >
          {({
            values,
            errors,
            touched,
            handleChange,
            handleBlur,
            handleSubmit,
          }) => (
            <Form onSubmit={handleSubmit}>
              <div style={{ marginBottom: "1.5rem" }}>
                <TextField
                  fullWidth
                  id="username"
                  name="username"
                  label="Username"
                  variant="outlined"
                  value={values.username}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.username && Boolean(errors.username)}
                  helperText={touched.username && errors.username}
                />
              </div>
              <div style={{ marginBottom: "2rem" }}>
                <TextField
                  fullWidth
                  id="password"
                  name="password"
                  label="Password"
                  type="password"
                  variant="outlined"
                  value={values.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.password && Boolean(errors.password)}
                  helperText={touched.password && errors.password}
                />
              </div>
              <Button
                type="submit"
                variant="contained"
                fullWidth
                disabled={loading}
                style={{
                  height: "3rem",
                  fontSize: "1rem",
                  backgroundColor: "#000",
                  color: "#fff",
                }}
              >
                {loading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  "Login"
                )}
              </Button>
            </Form>
          )}
        </Formik>
      </Paper>
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={5000}
        onClose={handleCloseSnackbar}
        message={snackbarMessage}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        sx={{
          "& .MuiSnackbarContent-root": {
            backgroundColor: "#1976d2",
            color: "white",
          },
        }}
      />
    </div>
  );
}

export default LoginPage;
