
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

let ws: WebSocket | null = null;
const WEBSOCKET_PATH = '/ws'; 

const connect = (router: any) => {
    if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
        console.log('Admin WebSocket connection already established or connecting.');
        return;
    }
    
    if (typeof window === 'undefined') return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // The WebSocket now connects to the same host and port as the main application, but on the /ws path.
    const websocketUrl = `${protocol}//${window.location.host}${WEBSOCKET_PATH}`;
    
    console.log(`Attempting to connect to WebSocket at ${websocketUrl}`);

    try {
        ws = new WebSocket(websocketUrl);
    } catch(e) {
        console.error("Could not create WebSocket connection to server", e);
        return;
    }

    ws.onopen = () => {
      console.log('Admin WebSocket connection established');
      ws?.send(JSON.stringify({ type: 'register', payload: { clientType: 'admin' } }));
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log('Admin received message:', message);
        
        if (message.type === 'status-changed' || message.type === 'refresh-request') {
          console.log('State changed on server, refreshing router...');
          router.refresh();
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    ws.onclose = (event) => {
      console.log('Admin WebSocket connection closed:', event.code, event.reason);
      ws = null;
      // Reconnect after a delay
      setTimeout(() => connect(router), 5000);
    };

    ws.onerror = (error) => {
      console.error('Admin WebSocket error:', error);
      ws?.close();
    };
}

export function useWebSocket() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      connect(router);
    }
  }, [router]); 
}
