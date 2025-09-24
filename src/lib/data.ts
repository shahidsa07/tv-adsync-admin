'server-only';
import { db } from '@/lib/firebase';
import type { TV, Group, Ad, Playlist, PriorityStream } from '@/lib/definitions';

// --- GETTERS ---

export const getTvs = async (): Promise<TV[]> => {
  if (!db) return [];
  const snapshot = await db.collection("tvs").get();
  return snapshot.docs.map(doc => doc.data() as TV);
};

export const getGroups = async (): Promise<Group[]> => {
    if (!db) return [];
    const snapshot = await db.collection("groups").get();
    return snapshot.docs.map(doc => doc.data() as Group);
};

export const getPlaylists = async (): Promise<Playlist[]> => {
    if (!db) return [];
    const snapshot = await db.collection("playlists").get();
    return snapshot.docs.map(doc => doc.data() as Playlist);
};

export const getAds = async (): Promise<Ad[]> => {
  if (!db) return [];
  const snapshot = await db.collection("ads").get();
  return snapshot.docs.map(doc => doc.data() as Ad);
};

export const getTvById = async (tvId: string): Promise<TV | undefined> => {
  if (!db) return undefined;
  const docSnap = await db.collection("tvs").doc(tvId).get();
  return docSnap.exists ? docSnap.data() as TV : undefined;
};

export const getGroupById = async (groupId: string): Promise<Group | undefined> => {
  if (!db) return undefined;
  const docSnap = await db.collection("groups").doc(groupId).get();
  return docSnap.exists ? docSnap.data() as Group : undefined;
};

export const getPlaylistById = async (playlistId: string): Promise<Playlist | undefined> => {
  if (!db) return undefined;
  const docSnap = await db.collection("playlists").doc(playlistId).get();
  return docSnap.exists ? docSnap.data() as Playlist : undefined;
};

export const getTvsByGroupId = async (groupId: string): Promise<TV[]> => {
  if (!db) return [];
  const snapshot = await db.collection("tvs").where("groupId", "==", groupId).get();
  return snapshot.docs.map(doc => doc.data() as TV);
};


// --- MUTATIONS ---

// TV Mutations
export const createTv = async (tvId: string, name: string): Promise<TV | undefined> => {
  if (!db) return undefined;
  const newTv: TV = { tvId, name: name || tvId, groupId: null, socketId: null };
  await db.collection("tvs").doc(tvId).set(newTv);
  return newTv;
};

export const updateTv = async (tvId: string, data: Partial<Pick<TV, 'name' | 'groupId'>>): Promise<TV | undefined> => {
  if (!db) return undefined;
  const docRef = db.collection("tvs").doc(tvId);
  await docRef.update(data);
  const docSnap = await docRef.get();
  return docSnap.data() as TV;
};

export const setTvOnlineStatus = async (tvId: string, isOnline: boolean): Promise<TV | undefined> => {
    if (!db) return undefined;
    const docRef = db.collection("tvs").doc(tvId);
    const socketId = isOnline ? `socket-fake-${Date.now()}` : null;
    await docRef.update({ socketId });
    const docSnap = await docRef.get();
    return docSnap.data() as TV;
};

// Group Mutations
export const createGroup = async (name: string): Promise<Group | undefined> => {
    if (!db) return undefined;
    const id = `group-${Date.now()}`;
    const docRef = db.collection("groups").doc(id);
    const newGroup: Group = { id, name, playlistId: null, priorityStream: null };
    await docRef.set(newGroup);
    return newGroup;
};

export const updateGroup = async (groupId: string, data: Partial<Pick<Group, 'name' | 'playlistId'>>): Promise<Group | undefined> => {
    if (!db) return undefined;
    const docRef = db.collection("groups").doc(groupId);
    await docRef.update(data);
    const docSnap = await docRef.get();
    return docSnap.data() as Group;
};

export const deleteGroup = async (groupId: string): Promise<boolean> => {
    if (!db) return false;
    await db.collection("groups").doc(groupId).delete();
    return true;
};

export const updateGroupTvs = async (groupId: string, tvIds: string[]): Promise<boolean> => {
    if (!db) return false;
    const batch = db.batch();
    const snapshot = await db.collection("tvs").where("groupId", "==", groupId).get();
    snapshot.forEach(docSnap => {
        if (!tvIds.includes(docSnap.id)) {
            batch.update(docSnap.ref, { groupId: null });
        }
    });
    for (const tvId of tvIds) {
        const tvRef = db.collection("tvs").doc(tvId);
        batch.update(tvRef, { groupId });
    }
    await batch.commit();
    return true;
};

export const updatePriorityStream = async (groupId: string, stream: PriorityStream | null): Promise<Group | undefined> => {
  if (!db) return undefined;
  const groupRef = db.collection("groups").doc(groupId);
  await groupRef.update({ priorityStream: stream });
  const docSnap = await groupRef.get();
  return docSnap.data() as Group;
};

// Ad Mutations
export const createAd = async (name: string, type: 'image' | 'video', url: string, duration?: number): Promise<Ad | undefined> => {
    if (!db) return undefined;
    const id = `ad-${Date.now()}`;
    const newAd: Ad = { id, name, type, url };
    if (type === 'image' && duration) {
        newAd.duration = duration;
    }
    await db.collection("ads").doc(id).set(newAd);
    return newAd;
};

export const deleteAd = async (adId: string): Promise<boolean> => {
    if (!db) return false;
    // In a real app, you'd also remove this adId from all playlists.
    await db.collection("ads").doc(adId).delete();
    return true;
};

// Playlist Mutations
export const createPlaylist = async (name: string): Promise<Playlist | undefined> => {
    if (!db) return undefined;
    const id = `playlist-${Date.now()}`;
    const newPlaylist: Playlist = { id, name, adIds: [] };
    await db.collection("playlists").doc(id).set(newPlaylist);
    return newPlaylist;
};

export const updatePlaylist = async (playlistId: string, data: Partial<Pick<Playlist, 'name' | 'adIds'>>): Promise<Playlist | undefined> => {
    if (!db) return undefined;
    const docRef = db.collection("playlists").doc(playlistId);
    await docRef.update(data);
    const docSnap = await docRef.get();
    return docSnap.data() as Playlist;
};

export const deletePlaylist = async (playlistId: string): Promise<boolean> => {
    if (!db) return false;
    // In a real app, you'd check if this playlist is used by any groups.
    await db.collection("playlists").doc(playlistId).delete();
    return true;
};
