import 'module-alias/register';
import { createServer } from 'http';
import next from 'next';
import { WebSocketServer, WebSocket } from 'ws';
import { setTvOnlineStatusAction } from '@/lib/actions';
import { URL } from 'url';

const dev = process.env.NODE_ENV !== 'production';
const hostname = '0.0.0.0'; // Listen on all available interfaces
const port = parseInt(process.env.PORT || '8080', 10);

const app = next({ dev });
const handle = app.getRequestHandler();

// Map to store TV connections
const tvConnections = new Map<string, WebSocket>();

app.prepare().then(() => {
  const server = createServer((req, res) => handle(req, res));

  const wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (request, socket, head) => {
    if (request.url) {
        const url = new URL(request.url, `http://${request.headers.host}`);
        const tvId = url.searchParams.get('tvId');
        if (tvId) {
            wss.handleUpgrade(request, socket, head, (ws) => {
                wss.emit('connection', ws, request);
            });
        } else {
            socket.destroy();
        }
    }
  });

  wss.on('connection', (ws, req) => {
    // Extract TV ID from the connection URL, e.g., /?tvId=tv-lobby-main-001
    const url = new URL(req.url || '', `http://${req.headers.host}`);
    const tvId = url.searchParams.get('tvId');
    
    if (tvId) {
      console.log(`[WebSocket] TV connected: ${tvId}`);
      tvConnections.set(tvId, ws);
      
      // Mark TV as online in the database
      setTvOnlineStatusAction(tvId, true).catch(console.error);

      ws.on('close', () => {
        console.log(`[WebSocket] TV disconnected: ${tvId}`);
        tvConnections.delete(tvId);
        // Mark TV as offline in the database
        setTvOnlineStatusAction(tvId, false).catch(console.error);
      });

      ws.on('error', (error) => {
        console.error(`[WebSocket] Error for TV ${tvId}:`, error);
      });

    } else {
      console.log('[WebSocket] Admin or unknown client connected.');
    }
  });

  server.listen(port, hostname, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
