'server-only';
import { db } from '@/lib/firebase';
import type { TV, Group, Ad, PriorityStream } from '@/lib/definitions';

// --- GETTERS ---

export const getTvs = async (): Promise<TV[] | undefined> => {
  if (!db) return undefined;
  const snapshot = await db.collection("tvs").get();
  return snapshot.docs.map(doc => doc.data() as TV);
};

export const getGroups = async (): Promise<Group[] | undefined> => {
    if (!db) return undefined;
    const snapshot = await db.collection("groups").get();
    return snapshot.docs.map(doc => doc.data() as Group);
};

export const getAds = async (): Promise<Ad[] | undefined> => {
  if (!db) return undefined;
  // This function currently returns static data, so it's not affected,
  // but it's good practice to keep the db check.
  const { placeholderImages } = await import('./placeholder-images.json');
  return [
    { id: 'ad-1', type: 'image', url: placeholderImages[0]?.imageUrl || "https://picsum.photos/seed/ad1/1920/1080", order: 1, duration: 15 },
    { id: 'ad-2', type: 'video', url: 'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4', order: 2 },
    { id: 'ad-3', type: 'image', url: placeholderImages[1]?.imageUrl || "https://picsum.photos/seed/ad2/1920/1080", order: 3, duration: 10 },
  ];
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

export const getTvsByGroupId = async (groupId: string): Promise<TV[] | undefined> => {
  if (!db) return undefined;
  const snapshot = await db.collection("tvs").where("groupId", "==", groupId).get();
  return snapshot.docs.map(doc => doc.data() as TV);
};


// --- MUTATIONS ---

export const createTv = async (tvId: string, name: string): Promise<TV | undefined> => {
  if (!db) return undefined;
  const newTv: TV = {
    tvId,
    name: name || tvId,
    groupId: null,
    socketId: null,
  };
  await db.collection("tvs").doc(tvId).set(newTv);
  return newTv;
};

export const createGroup = async (name: string): Promise<Group | undefined> => {
    if (!db) return undefined;
    const id = `group-${Date.now()}`;
    const docRef = db.collection("groups").doc(id);
    const newGroup: Group = {
        id,
        name,
        ads: [],
        priorityStream: null,
    };
    await docRef.set(newGroup);
    return newGroup;
};

export const deleteGroup = async (groupId: string): Promise<boolean> => {
    if (!db) return false;
    await db.collection("groups").doc(groupId).delete();
    return true;
};

export const updateTv = async (tvId: string, data: Partial<Pick<TV, 'name' | 'groupId'>>): Promise<TV | undefined> => {
  if (!db) return undefined;
  const docRef = db.collection("tvs").doc(tvId);
  await docRef.update(data);
  const docSnap = await docRef.get();
  return docSnap.data() as TV;
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

export const updateGroupAds = async (groupId: string, newAds: Ad[]): Promise<Group | undefined> => {
    if (!db) return undefined;
    const groupRef = db.collection("groups").doc(groupId);
    const adsWithOrder = newAds.map((ad, index) => ({...ad, id: ad.id.startsWith('new-') ? `ad-${Date.now()}-${index}`: ad.id, order: index + 1}));
    await groupRef.update({ ads: adsWithOrder });
    const docSnap = await groupRef.get();
    return docSnap.data() as Group;
};

export const updatePriorityStream = async (groupId: string, stream: PriorityStream | null): Promise<Group | undefined> => {
  if (!db) return undefined;
  const groupRef = db.collection("groups").doc(groupId);
  await groupRef.update({ priorityStream: stream });
  const docSnap = await groupRef.get();
  return docSnap.data() as Group;
};

export const setTvOnlineStatus = async (tvId: string, isOnline: boolean): Promise<TV | undefined> => {
    if (!db) return undefined;
    const docRef = db.collection("tvs").doc(tvId);
    const socketId = isOnline ? `socket-${Date.now()}` : null;
    await docRef.update({ socketId });
    const docSnap = await docRef.get();
    return docSnap.data() as TV;
};
