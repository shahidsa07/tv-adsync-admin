
"use client";

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

// --- IMPORTANT: CONFIGURE THIS ---
const WEBSOCKET_URL_BASE = 'ws://YOUR_SERVER_IP_HERE:8081'; // <-- Replace with your server's IP
// ---------------------------------


export function useTvData(tvId: string | null) {
  const [isLoading, setIsLoading] = useState(true);
  const [isInGroup, setIsInGroup] = useState(false);
  const [ads, setAds] = useState<Ad[]>([]);
  const [priorityStream, setPriorityStream] = useState<PriorityStream | null>(
    null
  );
  const ws = useRef<WebSocket | null>(null);
  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null);


  const fetchAndSetState = async (currentTvId: string) => {
    try {
      const state = await fetchTvState(currentTvId);
      setIsInGroup(!!state.group);
      setAds(state.playlist?.ads ?? []);
      setPriorityStream(state.group?.priorityStream ?? null);
      if (state.playlist?.ads) {
        await cleanupCache(state.playlist.ads);
        await processAds(state.playlist.ads, setAds);
      }
    } catch (error) {
      console.error(error);
      setIsInGroup(false);
      setAds([]);
      setPriorityStream(null);
    } finally {
      setIsLoading(false);
    }
  };

  const connectWebSocket = () => {
    if (!tvId) {
        console.log("TV ID not provided. WebSocket connection skipped.");
        return;
    }

    // Prevent multiple concurrent connection attempts
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
        console.log("WebSocket is already open.");
        return;
    }

    const fullUrl = `${WEBSOCKET_URL_BASE}/?tvId=${tvId}`;
    console.log(`Connecting to WebSocket: ${fullUrl}`);
    
    ws.current = new WebSocket(fullUrl);

    ws.current.onopen = () => {
      console.log("WebSocket connection established.");
      // Clear any pending reconnection timer
      if (reconnectTimeout.current) {
          clearTimeout(reconnectTimeout.current);
          reconnectTimeout.current = null;
      }
    };

    ws.current.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log("Message from server:", message);
        
        // The server sends a refresh command when content changes
        if (message.action === "refresh") {
          console.log("Refresh command received, fetching new state.");
          fetchAndSetState(tvId);
        }
      } catch (e) {
          console.error("Error parsing message from server:", e);
      }
    };

    ws.current.onerror = (error) => {
      console.error("WebSocket Error:", error.message);
      // The onclose event will be fired next, which will handle reconnection.
    };
    
    ws.current.onclose = () => {
        console.log("WebSocket connection closed. Attempting to reconnect in 5 seconds...");
        ws.current = null;
        // Set a timeout to try and reconnect
        if (!reconnectTimeout.current) {
            reconnectTimeout.current = setTimeout(connectWebSocket, 5000);
        }
    }
  }


  useEffect(() => {
    if (!tvId) {
        setIsLoading(false);
        return;
    }

    // Initial data fetch
    fetchAndSetState(tvId);
    
    // Start WebSocket connection
    connectWebSocket();

    // Cleanup function when the component unmounts or tvId changes
    return () => {
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
        reconnectTimeout.current = null;
      }
      if (ws.current) {
        console.log("Closing WebSocket connection due to component unmount or ID change.");
        ws.current.close();
        ws.current = null;
      }
    };
  }, [tvId]);

  return { isLoading, isInGroup, ads, priorityStream };
}
