
'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import type { TV, Playlist, PriorityStream } from '@/lib/definitions';
import { Loader2, Tv, WifiOff } from 'lucide-react';
import QRCode from 'qrcode';
import { Button } from '@/components/ui/button';

export const dynamic = 'force-dynamic';

interface TvState {
  tvId: string;
  name: string;
  group: { id: string; name: string } | null;
  playlist: Playlist | null;
  priorityStream: PriorityStream | null;
}

const POLLING_INTERVAL = 15000; // 15 seconds
const WEBSOCKET_RECONNECT_INTERVAL = 5000; // 5 seconds

function TVPlayer() {
  const searchParams = useSearchParams();
  const tvId = searchParams.get('tvId');
  const [state, setState] = useState<TvState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const adStartTimeRef = useRef<number | null>(null);

  // --- Data Fetching and State Management ---
  const fetchState = async () => {
    if (!tvId) {
      setError('TV ID is missing from the URL.');
      setIsLoading(false);
      return;
    }
    console.log(`Fetching state for ${tvId}...`);
    try {
      const response = await fetch(`/api/tv-state/${tvId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch TV state: ${response.statusText}`);
      }
      const data = await response.json();
      console.log('Received state:', data);
      setState(prevState => {
        // If the playlist has changed, reset the ad index
        if (prevState?.playlist?.id !== data.playlist?.id) {
          setCurrentAdIndex(0);
        }
        return { ...data, priorityStream: data.group?.priorityStream };
      });
      setError(null);
    } catch (e: any) {
      console.error(e);
      setError(e.message || 'Could not connect to the server.');
      // Keep existing state on error to avoid flicker, unless it's the initial load
      if (isLoading) setState(null);
    } finally {
      setIsLoading(false);
    }
  };


  // --- WebSocket Connection ---
  const setupWebSocket = () => {
    if (!tvId) return;
    if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
        return; // Connection already exists
    }
    
    const wsUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL!;
    
    console.log(`Connecting to WebSocket: ${wsUrl}`);
    const newWs = new WebSocket(wsUrl);

    newWs.onopen = () => {
      console.log('WebSocket connection established.');
      newWs.send(JSON.stringify({ type: 'register', payload: { tvId } }));
    };

    newWs.onmessage = (event) => {
      const message = JSON.parse(event.data);
      console.log('WebSocket message received:', message);
      if (message.type === 'REFRESH_STATE') {
        fetchState();
      }
    };

    newWs.onclose = (event) => {
      console.log('WebSocket connection closed.', event.code, event.reason);
      setWs(null); // Clear the ws state to allow reconnection
      setTimeout(() => setupWebSocket(), WEBSOCKET_RECONNECT_INTERVAL);
    };

    newWs.onerror = (error) => {
      console.error('WebSocket error:', error);
      newWs.close(); // This will trigger the onclose handler for reconnection
    };
    
    setWs(newWs);
  };
  
  
  // --- Ad Playback & Analytics ---

  const recordAdPlay = async (adId: string, duration: number) => {
    try {
      await fetch(`/api/analytics/record-play`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adId, tvId, duration }),
      });
    } catch (error) {
      console.error('Failed to record ad play:', error);
    }
  };

  const advanceAd = () => {
    const currentAd = state?.playlist?.ads[currentAdIndex];
    if (currentAd && adStartTimeRef.current) {
      const playedDuration = (Date.now() - adStartTimeRef.current) / 1000;
      recordAdPlay(currentAd.id, playedDuration);
    }

    setState(prevState => {
      if (!prevState || !prevState.playlist || prevState.playlist.ads.length === 0) {
        return prevState;
      }
      setCurrentAdIndex(prevIndex => (prevIndex + 1) % (prevState.playlist?.ads.length || 1));
      return prevState;
    });
  };

  useEffect(() => {
    adStartTimeRef.current = Date.now();
  }, [currentAdIndex, state?.playlist?.id]);


  // --- Effects ---

  // Initial fetch and setup polling/websockets
  useEffect(() => {
    fetchState();
    setupWebSocket();

    const pollingInterval = setInterval(fetchState, POLLING_INTERVAL);

    return () => {
      clearInterval(pollingInterval);
      if (ws) {
        ws.close(1000, "TV Player component unmounting");
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tvId]);

  // QR Code Generation
  useEffect(() => {
    if (!tvId) return;
    QRCode.toDataURL(tvId, {
      errorCorrectionLevel: 'H',
      width: 300,
      margin: 2,
      color: {
        dark: '#0f172a', // slate-900
        light: '#00000000' // transparent
      }
    })
    .then(url => setQrCodeUrl(url))
    .catch(err => console.error(err));
  }, [tvId]);

  // Ad rotation timer
  useEffect(() => {
    if (state?.priorityStream) return; // Don't rotate ads if priority stream is active

    const currentAd = state?.playlist?.ads[currentAdIndex];
    const duration = currentAd?.type === 'image' ? (currentAd.duration ?? 15) * 1000 : undefined;
    
    if (duration) {
      const timer = setTimeout(advanceAd, duration);
      return () => clearTimeout(timer);
    }
  }, [currentAdIndex, state, advanceAd]);


  // --- Render Logic ---

  if (isLoading) {
    return <div className="fixed inset-0 flex flex-col items-center justify-center bg-gray-900 text-white"><Loader2 className="animate-spin h-12 w-12 mb-4"/>Loading...</div>;
  }

  if (error && !state) {
     return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-gray-900 text-white p-8">
        <WifiOff className="h-16 w-16 mb-4 text-red-400" />
        <h1 className="text-2xl font-bold mb-2">Connection Error</h1>
        <p className="text-center text-gray-400 mb-6">{error}</p>
        <p className="text-sm text-gray-500">ID: {tvId}</p>
        <Button onClick={() => window.location.reload()} className='mt-4'>Retry</Button>
      </div>
    );
  }
  
  if (!tvId) {
    return <div className="fixed inset-0 flex items-center justify-center bg-gray-900 text-white">Please provide a TV ID in the URL.</div>;
  }

  if (!state || !state.group || !state.playlist || state.playlist.ads.length === 0) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-slate-900 text-white p-8 text-center">
        <div className="flex items-center gap-4 mb-6 bg-slate-800 p-4 rounded-lg">
          {qrCodeUrl && <Image src={qrCodeUrl} alt="QR Code" width={80} height={80} />}
          <div>
            <h1 className="text-2xl font-bold">{state?.name || 'Unregistered TV'}</h1>
            <p className="text-slate-400">ID: {tvId}</p>
          </div>
        </div>
        <Tv className="h-24 w-24 mb-4 text-slate-500" />
        <h2 className="text-3xl font-semibold mb-2">Waiting for Content</h2>
        <p className="text-slate-400 max-w-md">This TV is online and waiting to be assigned to a group with an active playlist. Please configure it in the admin dashboard.</p>
         <p className="text-xs text-slate-600 mt-8">Status: {error ? `Error (${error})` : 'Connected'}</p>
      </div>
    );
  }

  if (state.priorityStream) {
    const { type, url } = state.priorityStream;
    return (
      <div className="fixed inset-0 bg-black">
        {type === 'youtube' && (
          <iframe
            src={`${url}?autoplay=1&controls=0&mute=1&loop=1&playlist=${url.split('/').pop()}`}
            className="w-full h-full"
            frameBorder="0"
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
          ></iframe>
        )}
        {type === 'video' && (
          <video src={url} autoPlay muted loop playsInline className="w-full h-full object-cover" />
        )}
      </div>
    );
  }

  const currentAd = state.playlist.ads[currentAdIndex];

  if (!currentAd) {
      // This can happen if the playlist becomes empty while the player is running
      return null;
  }

  return (
    <div className="fixed inset-0 bg-black">
      {currentAd.type === 'image' ? (
        <Image src={currentAd.url} alt={currentAd.name} fill objectFit="cover" quality={100} priority />
      ) : (
        <video
          key={currentAd.url} // Re-mount the video element when the source changes
          src={currentAd.url}
          autoPlay
          muted
          playsInline
          onEnded={advanceAd}
          onError={(e) => {
            console.error('Video playback error:', e);
            advanceAd(); // Skip to the next ad on error
          }}
          className="w-full h-full object-cover"
        />
      )}
    </div>
  );
}

export default function TVPlayerPage() {
  return (
    <Suspense fallback={<div className="fixed inset-0 flex flex-col items-center justify-center bg-gray-900 text-white"><Loader2 className="animate-spin h-12 w-12 mb-4"/>Loading...</div>}>
      <TVPlayer />
    </Suspense>
  );
}
