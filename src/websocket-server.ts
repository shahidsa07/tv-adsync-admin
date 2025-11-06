'use server';
import 'module-alias/register';

import { WebSocketServer, WebSocket } from 'ws';
import { setTvOnlineStatusAction } from '@/lib/actions';
import { createServer, IncomingMessage, ServerResponse } from 'http';
import { config } from 'dotenv';
import { URL } from 'url';
config();

const port = parseInt(process.env.PORT || '8081', 10);
const tvConnections = new Map<string, WebSocket>();

// Create a simple HTTP server to handle both WebSocket upgrades and internal notification requests.
const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
    // Handle the internal notification endpoint
    if (req.url === '/notify' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            try {
                const { tvId } = JSON.parse(body);
                if (tvId && tvConnections.has(tvId)) {
                    const ws = tvConnections.get(tvId);
                    if (ws && ws.readyState === WebSocket.OPEN) {
                        ws.send(JSON.stringify({ action: 'refresh' }));
                        console.log(`[HTTP Notify] Sent refresh to ${tvId}`);
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ success: true, message: 'Notification sent.' }));
                    } else {
                         res.writeHead(400, { 'Content-Type': 'application/json' });
                         res.end(JSON.stringify({ success: false, message: 'TV not connected or connection not open.' }));
                    }
                } else {
                    res.writeHead(404, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, message: 'TV not found.' }));
                }
            } catch (error) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, message: 'Invalid JSON payload.' }));
            }
        });
    } else {
      // This server doesn't handle other HTTP requests, it's just for the WebSocket upgrade.
      res.writeHead(426, { 'Content-Type': 'text/plain' });
      res.end('Upgrade Required');
    }
});

const wss = new WebSocketServer({ server });

wss.on('connection', (ws, req) => {
  const url = new URL(req.url || '', `http://${req.headers.host}`);
  const tvId = url.searchParams.get('tvId');

  if (tvId) {
    console.log(`[WebSocket] TV connected: ${tvId}`);
    tvConnections.set(tvId, ws);

    setTvOnlineStatusAction(tvId, true).catch(console.error);

    ws.on('close', () => {
      console.log(`[WebSocket] TV disconnected: ${tvId}`);
      tvConnections.delete(tvId);
      setTvOnlineStatusAction(tvId, false).catch(console.error);
    });

    ws.on('error', (error) => {
      console.error(`[WebSocket] Error for TV ${tvId}:`, error);
    });
  } else {
    console.log('[WebSocket] Connection rejected: No tvId provided.');
    ws.close();
  }
});

server.listen(port, () => {
  console.log(`> WebSocket Server ready on port ${port}`);
});
