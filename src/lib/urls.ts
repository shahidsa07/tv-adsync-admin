
// --- Production URLs ---

// The base URL for the Next.js application's API routes.
// This runs on port 8080.
export const PROD_API_URL = 'http://65.0.171.58:8080/api';

// The URL for the standalone WebSocket server.
// This runs on port 8081. The connection must be insecure (ws://) 
// unless you have a reverse proxy (like Nginx) handling SSL termination.
export const PROD_WEBSOCKET_URL = 'ws://65.0.171.58:8081';
