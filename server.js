const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { setTvOnlineStatus, getTvById } = require('./dist/lib/data');
const { watchForNotifications, getNotificationCallback } = require('./dist/lib/ws-notifications');
const { WebSocketServer } = require('ws');
const path = require('path');
const fs = require('fs');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = 3000;

// When running in production, the app will be served from the .next folder.
// Otherwise, it will be served from the source code.
const app = next({ dev, hostname, port, dir: dev ? '.' : '.next' });
const handle = app.getRequestHandler();

// Create the .notifications directory if it doesn't exist
const NOTIFICATION_DIR = path.join(__dirname, '.notifications');
if (!fs.existsSync(NOTIFICATION_DIR)) {
  fs.mkdirSync(NOTIFICATION_DIR);
}

const sendNotification = (message) => {
    // This function will be set by the websocket-server.js
    const callback = getNotificationCallback();
    if (callback) {
        callback(message);
    } else {
        console.log("WebSocket notification callback not set. Notification queueing is disabled in production.");
    }
};

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error handling request:', err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  // Watch for notification files
  watchForNotifications(sendNotification);

  // In production, we create a WebSocket server here.
  // In development, the WebSocket server runs as a separate process.
  if (!dev) {
    const wss = new WebSocketServer({ server });
    initializeWebSocketServer(wss);
  }

  const portToListen = process.env.PORT || 3000;

  server.listen(portToListen, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://localhost:${portToListen}`);
  });
});


// This function is extracted to be reusable by the dev WebSocket server.
const initializeWebSocketServer = (wss) => {
    const tvConnections = new Map();
    const adminConnections = new Set();

    const handleTvConnection = async (tvId, isConnecting, socketId) => {
        try {
            await setTvOnlineStatus(tvId, isConnecting, socketId);
            adminConnections.forEach(ws => {
                if (ws.readyState === 1) { // OPEN
                    ws.send(JSON.stringify({ type: 'refresh-request' }));
                }
            });
        } catch (error) {
            console.error(`Error updating TV status for ${tvId}:`, error);
        }
    };
    
    // Set the notification callback
    setNotificationCallback((message) => {
        if (message.type === 'tv') {
            const ws = tvConnections.get(message.id);
            if (ws && ws.readyState === 1) { // OPEN
                ws.send(JSON.stringify({ type: 'REFRESH_STATE' }));
            }
        } else if (message.type === 'group' || message.type === 'all-admins') {
            // In production, we would need a way to look up TVs by group
            // For now, we will just refresh all admins
             adminConnections.forEach(ws => {
                if (ws.readyState === 1) { // OPEN
                    ws.send(JSON.stringify({ type: 'refresh-request' }));
                }
            });
        }
    });

    wss.on('connection', (ws) => {
        let clientId = null;
        let clientType = null;
        
        ws.on('message', async (message) => {
             try {
                const data = JSON.parse(message.toString());

                if (data.type === 'register' && data.payload) {
                    const { tvId, clientType: type } = data.payload;

                    if (type === 'admin') {
                        clientType = 'admin';
                        adminConnections.add(ws);
                        console.log('Admin client connected');
                        ws.send(JSON.stringify({ type: 'registered', clientType: 'admin' }));
                        return;
                    }
                    
                    if (tvId) {
                        clientType = 'tv';
                        clientId = tvId;
                        
                        if (tvConnections.has(clientId)) {
                            console.log(`Terminating old connection for ${clientId}`);
                            tvConnections.get(clientId)?.terminate();
                        }

                        tvConnections.set(clientId, ws);
                        console.log(`TV connection opened: ${clientId}`);
                        
                        const tvDoc = await getTvById(clientId);
                        if (tvDoc) {
                            await handleTvConnection(clientId, true, `ws-${Date.now()}`);
                        }
                        ws.send(JSON.stringify({ type: 'registered', tvId: clientId }));
                    }
                }
            } catch (error) {
                console.error(`Failed to process message: ${message.toString()}`, error);
            }
        });

        ws.on('close', async () => {
            if (clientType === 'admin') {
                adminConnections.delete(ws);
                console.log('Admin client disconnected');
            } else if (clientType === 'tv' && clientId) {
                console.log(`TV client disconnected: ${clientId}`);
                if (tvConnections.get(clientId) === ws) {
                    tvConnections.delete(clientId);
                    await handleTvConnection(clientId, false, null);
                }
            }
        });

         ws.on('error', (error) => {
            console.error('WebSocket error:', error);
        });
    });

    console.log(`WebSocket server initialized.`);
};

// Export for dev server
module.exports.initializeWebSocketServer = initializeWebSocketServer;
