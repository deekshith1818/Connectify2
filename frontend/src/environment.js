// Environment configuration
const IS_PROD = import.meta.env.PROD || false;

// Use environment variables if available, otherwise fallback to hardcoded values
const server = IS_PROD 
    ? (import.meta.env.VITE_API_URL || "https://connectify3.onrender.com")
    : (import.meta.env.VITE_DEV_API_URL || "http://localhost:8000");

export default server;
