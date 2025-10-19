
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function useWebSocket() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Use the current host and upgrade the protocol to ws/wss for production
    // For local development, specifically target the port our server is running on (9002)
    const isLocalDev = process.env.NODE_ENV === 'development';
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsHost = isLocalDev
      ? `${wsProtocol}//${window.location.hostname}:9002`
      : `${wsProtocol}//studio-96736714317.us-central1.run.app`;
    
    let ws: WebSocket;

    try {
        ws = new WebSocket(wsHost);
    } catch(e) {
        console.error("Could not create WebSocket connection to server", e);
        return;
    }


    ws.onopen = () => {
      console.log('Admin WebSocket connection established');
      // Register this client as an "admin" type
      ws.send(JSON.stringify({ type: 'register', payload: { clientType: 'admin' } }));
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log('Admin received message:', message);
        
        // If the server tells us the status of a TV changed, refresh the page data
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

    // Cleanup the connection when the component unmounts
    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, [router]); // router is a stable dependency
}
