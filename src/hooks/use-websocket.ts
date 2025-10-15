
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function useWebSocket() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // Connect to the Next.js API route proxy
    const wsUrl = `${wsProtocol}//${window.location.hostname}:9001`;
    
    let ws: WebSocket;

    try {
        ws = new WebSocket(wsUrl);
    } catch(e) {
        console.error("Could not create WebSocket connection to server", e);
        return;
    }

    ws.onopen = () => {
      console.log('Admin WebSocket connection established');
      ws.send(JSON.stringify({ type: 'register', payload: { clientType: 'admin' } }));
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log('Admin received message:', message);
        
        if (message.type === 'status-changed') {
          console.log('TV status changed, refreshing router...');
          router.refresh();
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    ws.onclose = () => {
      console.log('Admin WebSocket connection closed');
    };

    ws.onerror = (error) => {
      console.error('Admin WebSocket error:', error);
    };

    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, [router]);
}
