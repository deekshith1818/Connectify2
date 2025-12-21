// Environment configuration
const IS_PROD = import.meta.env.PROD || false;

// Use environment variables if available, otherwise fallback to hardcoded values
const server = IS_PROD
    ? "https://connectify3.onrender.com"
    : "http://localhost:8000";

console.log('API Server URL:', `${server}/api/v1/users`); // Debug line

// Debug information
console.log('Environment:', IS_PROD ? 'Production' : 'Development');
console.log('API Server:', server);

export default server;
