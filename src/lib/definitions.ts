export interface Ad {
  id: string;
  name: string;
  type: 'image' | 'video';
  url: string;
  duration?: number; // Only for images
}

export interface Playlist {
  id: string;
  name: string;
  adIds: string[];
}

export interface PriorityStream {
  type: 'video' | 'youtube';
  url: string;
}

export interface TV {
  tvId: string;
  name: string;
  groupId: string | null;
  socketId: string | null;
  shopLocation?: string;
}

export interface Group {
  id: string;
  name: string;
  playlistId: string | null;
  priorityStream: PriorityStream | null;
}

export interface AdPlay {
    id: string;
    adId: string;
    tvId: string;
    groupId: string | null;
    playedAt: number; // Firestore timestamp
    duration: number;
}

export type AdPerformanceDataPeriod = 'today' | 'week' | 'month' | 'year' | 'all';

export interface AdPerformanceData {
    adId: string;
    adName: string;
    totalPlaytime: number;
    uniqueTvs: number;
    playCount: number;
}

export interface AnalyticsSettings {
    isTrackingEnabled: boolean;
}
