export interface Ad {
  id: string;
  type: 'image' | 'video';
  url: string;
  order: number;
  duration?: number;
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
  ads: Ad[];
  priorityStream: PriorityStream | null;
}
