
import { createServer } from 'http';
import next from 'next';
import { WebSocketServer } from 'ws';
import { parse } from 'url';
import { setTvOnlineStatusAction } from './src/lib/actions';
import { getTvById } from './src/lib/data';

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 9002;

const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    try {
      const parsedUrl = parse(req.url!, true);
      handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error handling request:', err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  const wss = new WebSocketServer({ server });

  const tvConnections = new Map<string, import('ws')>();

  const handleTvConnection = async (tvId: string, isConnecting: boolean, ws: import('ws')) => {
    if (isConnecting) {
      if (tvConnections.has(tvId)) {
        console.log(`Terminating old connection for ${tvId}`);
        tvConnections.get(tvId)?.terminate();
      }
      tvConnections.set(tvId, ws);
      console.log(`TV connection opened: ${tvId}`);
    } else {
      if (tvConnections.get(tvId) === ws) {
        tvConnections.delete(tvId);
        console.log(`TV connection closed: ${tvId}`);
      }
    }
    
    const tvDoc = await getTvById(tvId);
    if (tvDoc) {
      await setTvOnlineStatusAction(tvId, isConnecting, isConnecting ? ws.toString() : null);
    }
  };
  
  wss.on('connection', (ws) => {
    let tvId: string | null = null;
  
    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message.toString());
        if (data.type === 'register' && data.payload?.tvId) {
          tvId = data.payload.tvId;
          await handleTvConnection(tvId!, true, ws);
          ws.send(JSON.stringify({ type: 'registered', tvId }));
        }
      } catch (error) {
        console.error(`Failed to process message: ${message.toString()}`, error);
      }
    });
  
    ws.on('close', async () => {
      if (tvId) {
        await handleTvConnection(tvId, false, ws);
      }
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });

  server.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
