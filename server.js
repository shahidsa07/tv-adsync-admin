
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { WebSocketServer } = require('ws');
const { setTvOnlineStatus, getTvById } = require('./dist/lib/data');
const { setNotificationCallback, notifyAdmins } = require('./dist/lib/ws-notifications');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = dev ? 9002 : 3000;
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// In-memory store for connections.
// In production, consider a more robust solution like Redis.
const tvConnections = new Map();
const adminConnections = new Set();

const handleTvConnection = async (tvId, isConnecting, socketId) => {
  try {
    await setTvOnlineStatus(tvId, isConnecting, socketId);
    notifyAdmins();
  } catch (error) {
    console.error(`Error updating TV status for ${tvId}:`, error);
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

  const wss = new WebSocketServer({ noServer: true });

  setNotificationCallback((notification) => {
    if (notification.type === 'tv') {
        const ws = tvConnections.get(notification.id);
        if (ws && ws.readyState === 1 /* OPEN */) {
            console.log(`Sending REFRESH_STATE to TV: ${notification.id}`);
            ws.send(JSON.stringify({ type: 'REFRESH_STATE' }));
        }
    } else if (notification.type === 'all-admins') {
        const message = JSON.stringify({ type: 'refresh-request' });
        adminConnections.forEach(ws => {
            if (ws.readyState === 1 /* OPEN */) {
                ws.send(message);
            }
        });
    }
  });


  server.on('upgrade', (request, socket, head) => {
    const { pathname } = parse(request.url, true);

    // This is now the single entry point for all WebSocket connections
    if (pathname === '/ws') {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    } else {
      socket.destroy();
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
      console.error('WebSocket error on connection:', error);
    });
  });

  const portToListen = dev ? port : process.env.PORT || 3000;
  const hostToListen = dev ? hostname : '0.0.0.0';

  server.listen(portToListen, hostToListen, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://${hostToListen}:${portToListen}`);
  });
});
