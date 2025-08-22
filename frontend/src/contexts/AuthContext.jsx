import { createContext, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import httpStatus from "http-status";
import server from "../environment"; // Adjust the import path as necessary

export const AuthContext = createContext({});

const client = axios.create({
  baseURL: `${server}/api/v1/users`,
  timeout: 10000, // 10 second timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for debugging
client.interceptors.request.use(
  (config) => {
    console.log("🚀 Making request to:", config.url);
    console.log("🚀 Request method:", config.method);
    console.log("🚀 Request data:", config.data);
    console.log("🚀 Request headers:", config.headers);
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
    console.log("✅ Response received:", {
      status: response.status,
      statusText: response.statusText,
      data: response.data,
      headers: response.headers,
    });
    return response;
  },
  (error) => {
    console.error("❌ Response error:", {
      message: error.message,
      code: error.code,
      response: error.response ? {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        headers: error.response.headers,
      } : "No response received",
      request: error.request ? "Request was made but no response received" : "No request made",
    });
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

      console.log("🎯 Registration response status:", response.status);
      
      if (response.status === httpStatus.CREATED) {
        console.log("✅ Registration successful");
        navigate("/home");
        return response.data.message;
      } else {
        console.log("❌ Registration failed - unexpected status:", response.status);
        throw new Error("Registration failed");
      }
    } catch (err) {
      console.error("💥 Registration error:", err);
      
      // Enhanced error handling
      if (err.response) {
        // Server responded with error status
        console.error("Server error response:", err.response.data);
        throw new Error(err.response.data.message || "Registration failed");
      } else if (err.request) {
        // Request was made but no response received
        console.error("No response received:", err.request);
        throw new Error("Unable to reach server. Please check if the server is running.");
      } else {
        // Something else happened
        console.error("Request setup error:", err.message);
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

      console.log("🎯 Login response status:", response.status);
      
      if (response.status === httpStatus.OK) {
        console.log("✅ Login successful");
        
        if (response.data.token) {
          localStorage.setItem("token", response.data.token);
          console.log("🔑 Token saved to localStorage");
        }
        
        if (response.data.user) {
          setUserData(response.data.user);
          console.log("👤 User data saved to context");
        }
        
        // Redirect to home after successful login
        navigate("/home");
        
        return response.data.message;
      } else {
        console.log("❌ Login failed - unexpected status:", response.status);
        throw new Error("Login failed");
      }
    } catch (err) {
      console.error("💥 Login error:", err);
      
      // Enhanced error handling
      if (err.response) {
        // Server responded with error status
        console.error("Server error response:", err.response.data);
        throw new Error(err.response.data.message || "Login failed");
      } else if (err.request) {
        // Request was made but no response received
        console.error("No response received:", err.request);
        throw new Error("Unable to reach server. Please check if the server is running.");
      } else {
        // Something else happened
        console.error("Request setup error:", err.message);
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
            return request.data
        } catch (err) {
            throw err;
        }
    }

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
            return request
        } catch (e) {
            throw e;
        }
    }


   

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
        getHistoryOfUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};