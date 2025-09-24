import type { TV, Group, Ad } from '@/lib/definitions';
import { placeholderImages } from './placeholder-images.json';

let ads: Ad[] = [
  { id: 'ad-1', type: 'image', url: placeholderImages[0]?.imageUrl || "https://picsum.photos/seed/ad1/1920/1080", order: 1, duration: 15 },
  { id: 'ad-2', type: 'video', url: 'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4', order: 2 },
  { id: 'ad-3', type: 'image', url: placeholderImages[1]?.imageUrl || "https://picsum.photos/seed/ad2/1920/1080", order: 3, duration: 10 },
];

let groups: Group[] = [
  {
    id: 'group-1',
    name: 'Ground Floor TVs',
    ads: [ads[0]],
    priorityStream: null,
  },
  {
    id: 'group-2',
    name: 'First Floor',
    ads: [ads[1], ads[2]],
    priorityStream: null,
  },
  {
    id: 'group-3',
    name: 'Lobby Screens',
    ads: [],
    priorityStream: {
      type: 'youtube',
      url: 'https://www.youtube.com/embed/jfKfPfyJRdk?autoplay=1'
    },
  },
];

let tvs: TV[] = [
  { tvId: 'tv-lobby-main-001', name: 'Lobby TV Main', groupId: 'group-3', socketId: 'socket-1' },
  { tvId: 'tv-lobby-side-002', name: 'Lobby TV Side', groupId: null, socketId: 'socket-2' },
  { tvId: 'tv-corridor-1f-003', name: 'Corridor Display 1F', groupId: 'group-2', socketId: 'socket-3' },
  { tvId: 'tv-office-entrance-004', name: 'Office Entrance', groupId: 'group-1', socketId: null },
  { tvId: 'tv-reception-desk-005', name: 'Reception Desk', groupId: 'group-1', socketId: 'socket-5' },
  { tvId: 'tv-meeting-room-006', name: 'Meeting Room Schedule', groupId: null, socketId: null },
];

// --- GETTERS ---

export const getTvs = (): TV[] => JSON.parse(JSON.stringify(tvs));
export const getGroups = (): Group[] => JSON.parse(JSON.stringify(groups));
export const getAds = (): Ad[] => JSON.parse(JSON.stringify(ads));

export const getTvById = (tvId: string): TV | undefined => tvs.find(tv => tv.tvId === tvId);
export const getGroupById = (groupId: string): Group | undefined => groups.find(g => g.id === groupId);
export const getTvsByGroupId = (groupId: string): TV[] => tvs.filter(tv => tv.groupId === groupId);

// --- MUTATIONS ---

export const createTv = (tvId: string, name: string): TV => {
  const newTv: TV = {
    tvId,
    name: name || tvId, // Default name is the ID if not provided
    groupId: null,
    socketId: null,
  };
  tvs.push(newTv);
  return newTv;
};

export const createGroup = (name: string): Group => {
  const newGroup: Group = {
    id: `group-${Date.now()}`,
    name,
    ads: [],
    priorityStream: null,
  };
  groups.push(newGroup);
  return newGroup;
};

export const updateTv = (tvId: string, data: Partial<Pick<TV, 'name' | 'groupId'>>): TV | undefined => {
  const tvIndex = tvs.findIndex(tv => tv.tvId === tvId);
  if (tvIndex === -1) return undefined;
  tvs[tvIndex] = { ...tvs[tvIndex], ...data };
  return tvs[tvIndex];
};

export const updateGroupTvs = (groupId: string, tvIds: string[]): void => {
  tvs.forEach(tv => {
    if (tv.groupId === groupId && !tvIds.includes(tv.tvId)) {
      tv.groupId = null;
    }
    if (tvIds.includes(tv.tvId)) {
      tv.groupId = groupId;
    }
  });
};

export const updateGroupAds = (groupId: string, newAds: Ad[]): Group | undefined => {
  const groupIndex = groups.findIndex(g => g.id === groupId);
  if (groupIndex === -1) return undefined;
  groups[groupIndex].ads = newAds.map((ad, index) => ({...ad, order: index + 1}));
  return groups[groupIndex];
};

export const updatePriorityStream = (groupId: string, stream: Group['priorityStream']): Group | undefined => {
  const groupIndex = groups.findIndex(g => g.id === groupId);
  if (groupIndex === -1) return undefined;
  groups[groupIndex].priorityStream = stream;
  return groups[groupIndex];
};

export const setTvOnlineStatus = (tvId: string, isOnline: boolean): TV | undefined => {
    const tvIndex = tvs.findIndex(tv => tv.tvId === tvId);
    if (tvIndex === -1) return undefined;
    tvs[tvIndex].socketId = isOnline ? `socket-${Date.now()}` : null;
    return tvs[tvIndex];
};
