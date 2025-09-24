'server-only';
import { db } from '@/lib/firebase';
import type { TV, Group, Ad, PriorityStream } from '@/lib/definitions';
import { collection, doc, getDoc, getDocs, setDoc, updateDoc, writeBatch, query, where, deleteDoc } from 'firebase/firestore';

const ensureDb = () => {
    if (!db) {
        throw new Error("Firestore is not initialized. Please check your Firebase credentials.");
    }
    return db;
}


// --- GETTERS ---

export const getTvs = async (): Promise<TV[]> => {
  const db = ensureDb();
  if (!db) return [];
  const querySnapshot = await getDocs(collection(db, "tvs"));
  return querySnapshot.docs.map(doc => doc.data() as TV);
};

export const getGroups = async (): Promise<Group[]> => {
    const db = ensureDb();
    if (!db) return [];
    const querySnapshot = await getDocs(collection(db, "groups"));
    return querySnapshot.docs.map(doc => doc.data() as Group);
};

export const getAds = async (): Promise<Ad[]> => {
  const { placeholderImages } = await import('./placeholder-images.json');
  return [
    { id: 'ad-1', type: 'image', url: placeholderImages[0]?.imageUrl || "https://picsum.photos/seed/ad1/1920/1080", order: 1, duration: 15 },
    { id: 'ad-2', type: 'video', url: 'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4', order: 2 },
    { id: 'ad-3', type: 'image', url: placeholderImages[1]?.imageUrl || "https://picsum.photos/seed/ad2/1920/1080", order: 3, duration: 10 },
  ];
};

export const getTvById = async (tvId: string): Promise<TV | undefined> => {
  const db = ensureDb();
  if (!db) return undefined;
  const docRef = doc(db, "tvs", tvId);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? docSnap.data() as TV : undefined;
};

export const getGroupById = async (groupId: string): Promise<Group | undefined> => {
  const db = ensureDb();
  if (!db) return undefined;
  const docRef = doc(db, "groups", groupId);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? docSnap.data() as Group : undefined;
};

export const getTvsByGroupId = async (groupId: string): Promise<TV[]> => {
  const db = ensureDb();
  if (!db) return [];
  const q = query(collection(db, "tvs"), where("groupId", "==", groupId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => doc.data() as TV);
};


// --- MUTATIONS ---

export const createTv = async (tvId: string, name: string): Promise<TV> => {
  const db = ensureDb();
  const newTv: TV = {
    tvId,
    name: name || tvId,
    groupId: null,
    socketId: null,
  };
  await setDoc(doc(db, "tvs", tvId), newTv);
  return newTv;
};

export const createGroup = async (name: string): Promise<Group> => {
    const db = ensureDb();
    const id = `group-${Date.now()}`;
    const newGroup: Group = {
        id,
        name,
        ads: [],
        priorityStream: null,
    };
    await setDoc(doc(db, "groups", id), newGroup);
    return newGroup;
};

export const deleteGroup = async (groupId: string): Promise<void> => {
    const db = ensureDb();
    const docRef = doc(db, "groups", groupId);
    await deleteDoc(docRef);
};

export const updateTv = async (tvId: string, data: Partial<Pick<TV, 'name' | 'groupId'>>): Promise<TV> => {
  const db = ensureDb();
  const docRef = doc(db, "tvs", tvId);
  await updateDoc(docRef, data);
  const docSnap = await getDoc(docRef);
  return docSnap.data() as TV;
};

export const updateGroupTvs = async (groupId: string, tvIds: string[]): Promise<void> => {
    const db = ensureDb();
    const batch = writeBatch(db);
    
    const q = query(collection(db, "tvs"), where("groupId", "==", groupId));
    const querySnapshot = await getDocs(q);

    querySnapshot.forEach(docSnap => {
        if (!tvIds.includes(docSnap.id)) {
            batch.update(docSnap.ref, { groupId: null });
        }
    });

    for (const tvId of tvIds) {
        const tvRef = doc(db, "tvs", tvId);
        batch.update(tvRef, { groupId });
    }

    await batch.commit();
};

export const updateGroupAds = async (groupId: string, newAds: Ad[]): Promise<Group> => {
    const db = ensureDb();
    const groupRef = doc(db, "groups", groupId);
    const adsWithOrder = newAds.map((ad, index) => ({...ad, id: ad.id.startsWith('new-') ? `ad-${Date.now()}-${index}`: ad.id, order: index + 1}));
    await updateDoc(groupRef, { ads: adsWithOrder });
    const docSnap = await getDoc(groupRef);
    return docSnap.data() as Group;
};

export const updatePriorityStream = async (groupId: string, stream: PriorityStream | null): Promise<Group> => {
  const db = ensureDb();
  const groupRef = doc(db, "groups", groupId);
  await updateDoc(groupRef, { priorityStream: stream });
  const docSnap = await getDoc(groupRef);
  return docSnap.data() as Group;
};

export const setTvOnlineStatus = async (tvId: string, isOnline: boolean): Promise<TV> => {
    const db = ensureDb();
    const docRef = doc(db, "tvs", tvId);
    const socketId = isOnline ? `socket-${Date.now()}` : null;
    await updateDoc(docRef, { socketId });
    const docSnap = await getDoc(docRef);
    return docSnap.data() as TV;
};
