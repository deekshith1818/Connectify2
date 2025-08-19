import * as React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import MuiCard from "@mui/material/Card";
import Checkbox from "@mui/material/Checkbox";
import Divider from "@mui/material/Divider";
import FormLabel from "@mui/material/FormLabel";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Link from "@mui/material/Link";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { styled } from "@mui/material/styles";
import ForgotPassword from "./ForgotPassword";
import { GoogleIcon, FacebookIcon, SitemarkIcon } from "./CustomIcons";
import Snackbar from "@mui/material/Snackbar";
import { AuthContext } from "../../contexts/AuthContext";

const Card = styled(MuiCard)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignSelf: "center",
  width: "100%",
  padding: theme.spacing(4),
  gap: theme.spacing(2),
  boxShadow:
    "hsla(220, 30%, 5%, 0.05) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.05) 0px 15px 35px -5px",
  [theme.breakpoints.up("sm")]: {
    width: "450px",
  },
  ...theme.applyStyles("dark", {
    boxShadow:
      "hsla(220, 30%, 5%, 0.5) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.08) 0px 15px 35px -5px",
  }),
}));

export default function SignInCard() {
  const [usernameError, setUsernameError] = React.useState(false);
  const [usernameErrorMessage, setUsernameErrorMessage] = React.useState("");
  const [passwordError, setPasswordError] = React.useState(false);
  const [passwordErrorMessage, setPasswordErrorMessage] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const [formState, setFormState] = React.useState(0); // 0: initial, 1: loading, 2: success, 3: error
  const [name, setName] = React.useState("");
  const [userName, setUserName] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [error, setError] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const validateInputs = () => {
    let isValid = true;

    if (!userName || userName.length < 3) {
      setUsernameError(true);
      setUsernameErrorMessage("Username must be at least 3 characters.");
      isValid = false;
    } else {
      setUsernameError(false);
      setUsernameErrorMessage("");
    }

    if (!password || password.length < 6) {
      setPasswordError(true);
      setPasswordErrorMessage("Password must be at least 6 characters long.");
      isValid = false;
    } else {
      setPasswordError(false);
      setPasswordErrorMessage("");
    }

    return isValid;
  };

  const { handleRegister, handleLogin } = React.useContext(AuthContext);

  let handleAuth = async () => {
    try {
      setIsLoading(true);
      setError("");
      
      console.log("🚀 Starting authentication...");
      console.log("Form state:", formState === 0 ? "Login" : "Register");
      console.log("Username:", userName);
      console.log("Password length:", password.length);

      if (formState === 0) {
        // Handle Sign In
        console.log("📝 Attempting login...");
        if (validateInputs()) {
          console.log("✅ Validation passed, calling handleLogin");
          let result = await handleLogin(userName, password);
          console.log("🎯 Login result:", result);
          
          if (result) {
            setMessage(result);
            setOpen(true);
            setError("");
            setUserName("");
            setPassword("");
            console.log("✅ Login successful");
            // Navigation will be handled by AuthContext
          } else {
            setError("Login failed");
            console.log("❌ Login failed - no result returned");
          }
        } else {
          console.log("❌ Validation failed");
        }
      } else {
        // Handle Sign Up
        console.log("📝 Attempting registration...");
        if (validateInputs()) {
          console.log("✅ Validation passed, calling handleRegister");
          let result = await handleRegister(name, userName, password);
          console.log("🎯 Register result:", result);
          
          if (result) {
            setMessage(result);
            setOpen(true);
            setError("");
            setFormState(1);
            setUserName("");
            setPassword("");
            console.log("✅ Registration successful");
          } else {
            setError("Registration failed");
            console.log("❌ Registration failed - no result returned");
          }
        } else {
          console.log("❌ Validation failed");
        }
      }
    } catch (e) {
      console.error("💥 Authentication error:", e);
      console.error("Error response:", e.response);
      console.error("Error message:", e.message);
      
      let message = e.response?.data?.message || e.message || "An error occurred";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card variant="outlined">
      <Box sx={{ display: { xs: "flex", md: "none" } }}>
        <SitemarkIcon />
      </Box>
      <Typography
        component="h1"
        variant="h4"
        sx={{ width: "100%", fontSize: "clamp(2rem, 10vw, 2.15rem)" }}
      >
        <Tabs
          value={formState}
          onChange={(e, newValue) => setFormState(newValue)}
          centered
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab label="Sign In" value={0} />
          <Tab label="Sign Up" value={1} />
        </Tabs>
      </Typography>
      
      <Box
        component="form"
        noValidate
        sx={{ display: "flex", flexDirection: "column", width: "100%", gap: 2 }}
      >
        {formState === 1 ? (
          <FormControl>
            <FormLabel htmlFor="name">Name</FormLabel>
            <TextField
              id="name"
              type="name"
              value={name}
              name="name"
              placeholder="Full Name"
              autoComplete="name"
              autoFocus
              required
              fullWidth
              variant="outlined"
              onChange={(e) => {
                setName(e.target.value);
              }}
            />
          </FormControl>
        ) : null}

        <FormControl>
          <FormLabel htmlFor="username">Username</FormLabel>
          <TextField
            error={usernameError}
            helperText={usernameErrorMessage}
            id="username"
            type="username"
            name="username"
            value={userName}
            placeholder="Username"
            autoComplete="username"
            autoFocus
            required
            fullWidth
            variant="outlined"
            color={usernameError ? "error" : "primary"}
            onChange={(e) => {
              setUserName(e.target.value);
            }}
          />
        </FormControl>
        
        <FormControl>
          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
            <FormLabel htmlFor="password">Password</FormLabel>
          </Box>
          <TextField
            error={passwordError}
            helperText={passwordErrorMessage}
            name="password"
            value={password}
            placeholder="••••••"
            type="password"
            id="password"
            autoComplete="current-password"
            autoFocus
            required
            fullWidth
            variant="outlined"
            color={passwordError ? "error" : "primary"}
            onChange={(e) => {
              setPassword(e.target.value);
            }}
          />
        </FormControl>
        
        {error && <p style={{ color: "red" }}>{error}</p>}
        
        <FormControlLabel
          control={<Checkbox value="remember" color="primary" />}
          label="Remember me"
        />
        
        <ForgotPassword open={open} handleClose={handleClose} />
        
        <Button
          type="submit"
          fullWidth
          variant="contained"
          disabled={isLoading}
          onClick={(e) => {
            e.preventDefault();
            handleAuth();
          }}
        >
          {isLoading 
            ? "Processing..." 
            : (formState === 0 ? "LogIn" : "Register")
          }
        </Button>
      </Box>
      
      <Snackbar
        open={open}
        autoHideDuration={6000}
        onClose={handleClose}
        message={message}
      />
    </Card>
  );
}