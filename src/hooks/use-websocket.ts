
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

let ws: WebSocket | null = null;
const WEBSOCKET_PORT = 9003; 

const connect = (router: any) => {
    // Check if running in a browser environment
    if (typeof window === 'undefined') {
      return;
    }
    
    // Prevent multiple connections
    if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
        console.log('Admin WebSocket connection already established or connecting.');
        return;
    }
    
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // Use the same hostname but the dedicated WebSocket port
    const websocketUrl = `${protocol}//${window.location.hostname}:${WEBSOCKET_PORT}`;
    
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
        
        // This message is sent from the server to request a data refresh
        if (message.type === 'refresh-request') {
          console.log('Refresh request received from server, refreshing router...');
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
      // ws.close() will be called automatically by the browser on error
    };
}

export function useWebSocket() {
  const router = useRouter();

  useEffect(() => {
    connect(router);
    
    // Clean up on component unmount
    return () => {
        if (ws && ws.readyState === WebSocket.OPEN) {
            console.log('Closing admin WebSocket connection on component unmount.');
            ws.close();
        }
    }
  }, [router]); 
}
