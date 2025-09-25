"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function useWebSocket() {
  const router = useRouter();

  useEffect(() => {
    // Determine the WebSocket protocol
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // Use the same hostname as the current window, but with port 8080
    const wsHost = `${wsProtocol}//${window.location.hostname}:8080`;
    
    const ws = new WebSocket(wsHost);

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
      ws.close();
    };
  }, [router]); // router is a stable dependency
}
