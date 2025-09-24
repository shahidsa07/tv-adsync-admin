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
}

export interface Group {
  id: string;
  name: string;
  playlistId: string | null;
  priorityStream: PriorityStream | null;
}
