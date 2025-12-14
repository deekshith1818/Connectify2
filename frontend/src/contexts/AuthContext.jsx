import { createContext, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import httpStatus from "http-status";
import server from "../environment";

export const AuthContext = createContext({});

const client = axios.create({
  baseURL: `${server}/api/v1/users`,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  withCredentials: true
});

// Add request interceptor for debugging
client.interceptors.request.use(
  (config) => {
    console.log("🚀 Making request to:", config.url);
    return config;
  },
  (error) => {
    console.error("❌ Request error:", error);
    return Promise.reject(error);
  }
);

// Add response interceptor for debugging
client.interceptors.response.use(
  (response) => {
    console.log("✅ Response received:", response.status);
    return response;
  },
  (error) => {
    console.error("❌ Response error:", error.message);
    return Promise.reject(error);
  }
);

export const AuthProvider = ({ children }) => {
  const [userData, setUserData] = useState(null);
  const navigate = useNavigate();

  const handleRegister = async (name, username, password) => {
    try {
      console.log("📝 Starting registration for:", username);
      
      const response = await client.post("/register", {
        name,
        username,
        password,
      });

      if (response.status === httpStatus.CREATED) {
        console.log("✅ Registration successful");
        navigate("/home");
        return response.data.message;
      } else {
        throw new Error("Registration failed");
      }
    } catch (err) {
      console.error("💥 Registration error:", err);
      if (err.response) {
        throw new Error(err.response.data.message || "Registration failed");
      } else if (err.request) {
        throw new Error("Unable to reach server. Please check if the server is running.");
      } else {
        throw err;
      }
    }
  };

  const handleLogin = async (username, password) => {
    try {
      console.log("🔐 Starting login for:", username);
      
      const response = await client.post("/login", {
        username,
        password,
      });

      if (response.status === httpStatus.OK) {
        console.log("✅ Login successful");
        
        if (response.data.token) {
          localStorage.setItem("token", response.data.token);
        }
        
        if (response.data.user) {
          setUserData(response.data.user);
        }
        
        navigate("/home");
        return response.data.message;
      } else {
        throw new Error("Login failed");
      }
    } catch (err) {
      console.error("💥 Login error:", err);
      if (err.response) {
        throw new Error(err.response.data.message || "Login failed");
      } else if (err.request) {
        throw new Error("Unable to reach server. Please check if the server is running.");
      } else {
        throw err;
      }
    }
  };

  const getHistoryOfUser = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found");
      }
      
      let request = await client.get("/get_all_activity", {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return request.data;
    } catch (err) {
      throw err;
    }
  };

  const addToUserHistory = async (meetingCode) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found");
      }
      
      let request = await client.post("/add_to_activity", {
        meeting_code: meetingCode
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return request;
    } catch (e) {
      throw e;
    }
  };

  // ========== MEETING API FUNCTIONS ==========

  /**
   * Start a new meeting (creates room in DB)
   * @returns {Promise<string>} The generated meeting code
   */
  const startMeeting = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found. Please log in.");
      }

      const response = await axios.post(
        `${server}/api/v1/meetings/start`,
        {},
        {
          timeout: 30000,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          withCredentials: true
        }
      );

      if (response.data.success) {
        console.log("🎬 Meeting created:", response.data.meetingCode);
        return response.data.meetingCode;
      } else {
        throw new Error(response.data.message || "Failed to create meeting");
      }
    } catch (err) {
      console.error("❌ Error starting meeting:", err);
      if (err.response?.data?.message) {
        throw new Error(err.response.data.message);
      }
      throw err;
    }
  };

  /**
   * Validate if a meeting code is valid and active
   * @param {string} meetingCode - The meeting code to validate
   * @returns {Promise<boolean>} True if valid, throws error if not
   */
  const validateMeeting = async (meetingCode) => {
    try {
      const response = await axios.get(
        `${server}/api/v1/meetings/validate/${meetingCode.toUpperCase()}`,
        {
          timeout: 10000,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        console.log("✅ Meeting validated:", meetingCode);
        return true;
      }
      return false;
    } catch (err) {
      console.error("❌ Meeting validation failed:", err);
      if (err.response?.status === 404) {
        throw new Error("Invalid or expired meeting code");
      }
      throw new Error(err.response?.data?.message || "Failed to validate meeting");
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUserData(null);
    navigate("/");
    console.log("👋 User logged out");
  };

  return (
    <AuthContext.Provider 
      value={{ 
        userData, 
        setUserData, 
        handleRegister, 
        handleLogin, 
        logout,
        addToUserHistory,
        getHistoryOfUser,
        startMeeting,
        validateMeeting
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};