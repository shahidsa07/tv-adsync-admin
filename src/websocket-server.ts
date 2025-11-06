'use server';
import 'module-alias/register';

// This is a standalone server for WebSocket connections.
// It runs separately from the main Next.js app.
import { WebSocketServer, WebSocket } from 'ws';
import { setTvOnlineStatusAction } from '@/lib/actions';
import { createServer } from 'http';
import { config } from 'dotenv';
config();

const port = parseInt(process.env.PORT || '8081', 10);
const tvConnections = new Map<string, WebSocket>();

// We create a simple HTTP server to attach the WebSocket server to.
const server = createServer((req, res) => {
  // This server doesn't handle HTTP requests, it's just for the WebSocket upgrade.
  res.writeHead(426, { 'Content-Type': 'text/plain' });
  res.end('Upgrade Required');
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
    console.log('[WebSocket] Admin or unknown client connected.');
    ws.close();
  }
});

server.listen(port, () => {
  console.log(`> WebSocket Server ready on port ${port}`);
});
