
"use client";

import { useEffect, useState, useRef } from 'react';
import type { Ad, PriorityStream } from '@/lib/definitions';
import { fetchTvState } from '@/lib/api-client'; // Assuming you have this helper
import * as FileSystem from 'expo-file-system'; // Using new import style

const adCacheDir = FileSystem.cacheDirectory + "ad-cache/";

const getCacheFilename = (url: string) => {
  // A more robust way to get a unique filename
  return url.replace(/[^a-zA-Z0-9]/g, '_');
};

const ensureDirExists = async () => {
  const dirInfo = await FileSystem.getInfoAsync(adCacheDir);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(adCacheDir, { intermediates: true });
  }
};

const cleanupCache = async (activeAds: Ad[]) => {
  try {
    await ensureDirExists();
    const activeFilenames = new Set(activeAds.map((ad) => getCacheFilename(ad.url)));
    const cachedFiles = await FileSystem.readDirectoryAsync(adCacheDir);

    for (const filename of cachedFiles) {
      if (!activeFilenames.has(filename)) {
        console.log("Deleting stale cache file:", filename);
        await FileSystem.deleteAsync(adCacheDir + filename, { idempotent: true });
      }
    }
  } catch (error) {
    console.error("Failed to clean up cache:", error);
  }
};

const processAds = async (
  ads: Ad[],
  setAds: React.Dispatch<React.SetStateAction<Ad[]>>
) => {
  await ensureDirExists();

  for (const ad of ads) {
    const filename = getCacheFilename(ad.url);
    const localUri = adCacheDir + filename;

    const fileInfo = await FileSystem.getInfoAsync(localUri);

    if (fileInfo.exists) {
      setAds((prev) =>
        prev.map((prevAd) =>
          prevAd.id === ad.id ? { ...prevAd, localUri, caching: false } : prevAd
        )
      );
    } else {
      setAds((prev) =>
        prev.map((prevAd) =>
          prevAd.id === ad.id ? { ...prevAd, caching: true } : prevAd
        )
      );
      try {
        console.log("Downloading ad:", ad.url);
        const { uri } = await FileSystem.downloadAsync(ad.url, localUri);
        setAds((prev) =>
          prev.map((prevAd) =>
            prevAd.id === ad.id ? { ...prevAd, localUri: uri, caching: false } : prevAd
          )
        );
      } catch (error) {
        console.error("Failed to download ad:", ad.url, error);
        setAds((prev) =>
          prev.map((prevAd) =>
            prevAd.id === ad.id ? { ...prevAd, caching: false } : prevAd
          )
        );
      }
    }
  }
};

// You would define this in your api constants file
const WEBSOCKET_URL_BASE = 'ws://YOUR_SERVER_IP_HERE:8081'; // <-- IMPORTANT

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

    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
        console.log("WebSocket is already open.");
        return;
    }

    const fullUrl = `${WEBSOCKET_URL_BASE}`; // The server doesn't need the tvId in the URL anymore
    console.log(`Connecting to WebSocket: ${fullUrl}`);
    
    ws.current = new WebSocket(fullUrl);

    ws.current.onopen = () => {
      console.log("WebSocket connection established. Registering TV...");
      // Register the client as per the new protocol
      ws.current?.send(JSON.stringify({ type: "register", payload: { tvId } }));

      if (reconnectTimeout.current) {
          clearTimeout(reconnectTimeout.current);
          reconnectTimeout.current = null;
      }
    };

    ws.current.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log("Message from server:", message);
        
        // Listen for the new message type
        if (message.type === "REFRESH_STATE") {
          console.log("REFRESH_STATE command received, fetching new state.");
          fetchAndSetState(tvId);
        }
      } catch (e) {
          console.error("Error parsing message from server:", e);
      }
    };

    ws.current.onerror = (error) => {
      console.error("WebSocket Error:", error.message);
    };
    
    ws.current.onclose = () => {
        console.log("WebSocket connection closed. Attempting to reconnect in 5 seconds...");
        ws.current = null;
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

    fetchAndSetState(tvId);
    connectWebSocket();

    return () => {
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
        reconnectTimeout.current = null;
      }
      if (ws.current) {
        console.log("Closing WebSocket connection due to component unmount.");
        ws.current.close();
        ws.current = null;
      }
    };
  }, [tvId]);

  return { isLoading, isInGroup, ads, priorityStream };
}
