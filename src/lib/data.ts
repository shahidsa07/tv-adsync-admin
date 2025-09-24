import { db } from '@/lib/firebase';
import type { TV, Group, Ad, PriorityStream } from '@/lib/definitions';
import { collection, doc, getDoc, getDocs, setDoc, updateDoc, writeBatch, query, where } from 'firebase/firestore';

// --- GETTERS ---

export const getTvs = async (): Promise<TV[]> => {
  const querySnapshot = await getDocs(collection(db, "tvs"));
  return querySnapshot.docs.map(doc => doc.data() as TV);
};

export const getGroups = async (): Promise<Group[]> => {
    const querySnapshot = await getDocs(collection(db, "groups"));
    return querySnapshot.docs.map(doc => doc.data() as Group);
};

export const getAds = async (): Promise<Ad[]> => {
  // This could also be a collection in Firestore if ads need to be managed dynamically.
  // For now, returning a static list as it was before, but it's not stored in Firestore.
  const { placeholderImages } = await import('./placeholder-images.json');
  return [
    { id: 'ad-1', type: 'image', url: placeholderImages[0]?.imageUrl || "https://picsum.photos/seed/ad1/1920/1080", order: 1, duration: 15 },
    { id: 'ad-2', type: 'video', url: 'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4', order: 2 },
    { id: 'ad-3', type: 'image', url: placeholderImages[1]?.imageUrl || "https://picsum.photos/seed/ad2/1920/1080", order: 3, duration: 10 },
  ];
};

export const getTvById = async (tvId: string): Promise<TV | undefined> => {
  const docRef = doc(db, "tvs", tvId);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? docSnap.data() as TV : undefined;
};

export const getGroupById = async (groupId: string): Promise<Group | undefined> => {
  const docRef = doc(db, "groups", groupId);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? docSnap.data() as Group : undefined;
};

export const getTvsByGroupId = async (groupId: string): Promise<TV[]> => {
  const q = query(collection(db, "tvs"), where("groupId", "==", groupId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => doc.data() as TV);
};


// --- MUTATIONS ---

export const createTv = async (tvId: string, name: string): Promise<TV> => {
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

export const updateTv = async (tvId: string, data: Partial<Pick<TV, 'name' | 'groupId'>>): Promise<TV | undefined> => {
  const docRef = doc(db, "tvs", tvId);
  await updateDoc(docRef, data);
  const docSnap = await getDoc(docRef);
  return docSnap.data() as TV;
};

export const updateGroupTvs = async (groupId: string, tvIds: string[]): Promise<void> => {
    const batch = writeBatch(db);
    
    // Get all TVs currently in the group
    const q = query(collection(db, "tvs"), where("groupId", "==", groupId));
    const querySnapshot = await getDocs(q);

    // Unassign TVs that are no longer in the group
    querySnapshot.forEach(docSnap => {
        if (!tvIds.includes(docSnap.id)) {
            batch.update(docSnap.ref, { groupId: null });
        }
    });

    // Assign new TVs to the group
    for (const tvId of tvIds) {
        const tvRef = doc(db, "tvs", tvId);
        batch.update(tvRef, { groupId });
    }

    await batch.commit();
};

export const updateGroupAds = async (groupId: string, newAds: Ad[]): Promise<Group | undefined> => {
    const groupRef = doc(db, "groups", groupId);
    const adsWithOrder = newAds.map((ad, index) => ({...ad, order: index + 1}));
    await updateDoc(groupRef, { ads: adsWithOrder });
    const docSnap = await getDoc(groupRef);
    return docSnap.data() as Group;
};

export const updatePriorityStream = async (groupId: string, stream: PriorityStream | null): Promise<Group | undefined> => {
  const groupRef = doc(db, "groups", groupId);
  await updateDoc(groupRef, { priorityStream: stream });
  const docSnap = await getDoc(groupRef);
  return docSnap.data() as Group;
};

export const setTvOnlineStatus = async (tvId: string, isOnline: boolean): Promise<TV | undefined> => {
    const docRef = doc(db, "tvs", tvId);
    const socketId = isOnline ? `socket-${Date.now()}` : null;
    await updateDoc(docRef, { socketId });
    const docSnap = await getDoc(docRef);
    return docSnap.data() as TV;
};

// Seed initial data if collections are empty
export const seedInitialData = async () => {
    const tvsSnapshot = await getDocs(collection(db, 'tvs'));
    if (tvsSnapshot.empty) {
        console.log('Seeding initial TVs...');
        const initialTvs: TV[] = [
            { tvId: 'tv-lobby-main-001', name: 'Lobby TV Main', groupId: 'group-3', socketId: 'socket-1' },
            { tvId: 'tv-lobby-side-002', name: 'Lobby TV Side', groupId: null, socketId: 'socket-2' },
            { tvId: 'tv-corridor-1f-003', name: 'Corridor Display 1F', groupId: 'group-2', socketId: 'socket-3' },
            { tvId: 'tv-office-entrance-004', name: 'Office Entrance', groupId: 'group-1', socketId: null },
            { tvId: 'tv-reception-desk-005', name: 'Reception Desk', groupId: 'group-1', socketId: 'socket-5' },
            { tvId: 'tv-meeting-room-006', name: 'Meeting Room Schedule', groupId: null, socketId: null },
        ];
        const batch = writeBatch(db);
        initialTvs.forEach(tv => {
            const tvRef = doc(db, 'tvs', tv.tvId);
            batch.set(tvRef, tv);
        });
        await batch.commit();
    }

    const groupsSnapshot = await getDocs(collection(db, 'groups'));
    if (groupsSnapshot.empty) {
        console.log('Seeding initial Groups...');
        const { placeholderImages } = await import('./placeholder-images.json');
        const ads: Ad[] = [
          { id: 'ad-1', type: 'image', url: placeholderImages[0]?.imageUrl || "https://picsum.photos/seed/ad1/1920/1080", order: 1, duration: 15 },
          { id: 'ad-2', type: 'video', url: 'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4', order: 2 },
          { id: 'ad-3', type: 'image', url: placeholderImages[1]?.imageUrl || "https://picsum.photos/seed/ad2/1920/1080", order: 3, duration: 10 },
        ];
        const initialGroups: Group[] = [
            { id: 'group-1', name: 'Ground Floor TVs', ads: [ads[0]], priorityStream: null },
            { id: 'group-2', name: 'First Floor', ads: [ads[1], ads[2]], priorityStream: null },
            { id: 'group-3', name: 'Lobby Screens', ads: [], priorityStream: { type: 'youtube', url: 'https://www.youtube.com/embed/jfKfPfyJRdk?autoplay=1' } },
        ];
        const batch = writeBatch(db);
        initialGroups.forEach(group => {
            const groupRef = doc(db, 'groups', group.id);
            batch.set(groupRef, group);
        });
        await batch.commit();
    }
};
