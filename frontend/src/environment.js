// Environment configuration
const IS_PROD = import.meta.env.PROD || false;

// Use environment variables if available, otherwise fallback to hardcoded values
const server = IS_PROD 
    ? (import.meta.env.VITE_API_URL || "https://your-backend-name.onrender.com")
    : (import.meta.env.VITE_DEV_API_URL || "http://localhost:8000");

console.log('Environment:', IS_PROD ? 'Production' : 'Development');
console.log('API Server:', server);

export default server;
