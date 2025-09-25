'server-only';
import { db } from '@/lib/firebase';
import type { TV, Group, Ad, Playlist, PriorityStream, AdPlay, AdPerformanceData, AnalyticsSettings, AdPerformanceDataPeriod } from '@/lib/definitions';
import { FieldValue } from 'firebase-admin/firestore';
import { startOfDay, startOfWeek, startOfMonth, startOfYear, endOfDay, endOfWeek, endOfMonth, endOfYear } from 'date-fns';

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

export const getGroupsByPlaylistId = async(playlistId: string): Promise<Group[]> => {
    if (!db) return [];
    const snapshot = await db.collection('groups').where('playlistId', '==', playlistId).get();
    return snapshot.docs.map(doc => doc.data() as Group);
}

export const getPlaylistsContainingAd = async(adId: string): Promise<Playlist[]> => {
    if (!db) return [];
    const snapshot = await db.collection('playlists').where('adIds', 'array-contains', adId).get();
    return snapshot.docs.map(doc => doc.data() as Playlist);
}


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

export const deleteTv = async (tvId: string): Promise<boolean> => {
    if (!db) return false;
    await db.collection("tvs").doc(tvId).delete();
    return true;
}

export const setTvOnlineStatus = async (tvId: string, isOnline: boolean, socketId: string | null): Promise<TV | undefined> => {
    if (!db) return undefined;
    const docRef = db.collection("tvs").doc(tvId);
    // Check if the document exists before trying to update it
    const docSnap = await docRef.get();
    if (!docSnap.exists) {
        console.log(`TV ${tvId} not found in database, skipping status update.`);
        return undefined;
    }
    await docRef.update({ socketId });
    // Re-fetch the document to return the updated state
    const updatedDocSnap = await docRef.get();
    return updatedDocSnap.data() as TV;
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

export const updateAd = async (adId: string, data: Partial<Pick<Ad, 'name' | 'type' | 'url' | 'duration'>>): Promise<Ad | undefined> => {
    if (!db) return undefined;
    const docRef = db.collection("ads").doc(adId);
    
    const updateData: any = { ...data };
    if (data.type === 'video') {
        // Ensure duration is removed for videos
        updateData.duration = FieldValue.delete();
    }
    
    await docRef.update(updateData);
    const docSnap = await docRef.get();
    return docSnap.data() as Ad;
};

export const deleteAd = async (adId: string): Promise<boolean> => {
    if (!db) return false;
    const batch = db.batch();
    const adRef = db.collection("ads").doc(adId);
    batch.delete(adRef);

    // Remove the ad from all playlists that contain it
    const playlistsSnapshot = await db.collection("playlists").where("adIds", "array-contains", adId).get();
    playlistsSnapshot.forEach(doc => {
        const playlistRef = db.collection("playlists").doc(doc.id);
        batch.update(playlistRef, { adIds: FieldValue.arrayRemove(adId) });
    });

    await batch.commit();
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
    const batch = db.batch();
    const playlistRef = db.collection("playlists").doc(playlistId);
    batch.delete(playlistRef);

    // Unset this playlist from any groups that are using it.
    const groupsSnapshot = await db.collection('groups').where('playlistId', '==', playlistId).get();
    groupsSnapshot.forEach(doc => {
        const groupRef = db.collection('groups').doc(doc.id);
        batch.update(groupRef, { playlistId: null });
    });
    
    await batch.commit();
    return true;
};

// --- ANALYTICS ---

export const getAnalyticsSettings = async (): Promise<AnalyticsSettings> => {
    if (!db) return { isTrackingEnabled: false };
    const docRef = db.collection('settings').doc('analytics');
    const docSnap = await docRef.get();
    if (docSnap.exists) {
        return docSnap.data() as AnalyticsSettings;
    }
    // Default to disabled if not set
    return { isTrackingEnabled: false };
};

export const setAnalyticsSettings = async (settings: AnalyticsSettings): Promise<boolean> => {
    if (!db) return false;
    await db.collection('settings').doc('analytics').set(settings, { merge: true });
    return true;
};

export const createAdPlay = async (adId: string, tvId: string, duration: number): Promise<void> => {
    if (!db) return;
    const tv = await getTvById(tvId);
    const playId = `play-${Date.now()}`;
    const adPlay: AdPlay = {
        id: playId,
        adId,
        tvId,
        groupId: tv?.groupId || null,
        playedAt: Date.now(),
        duration,
    };
    await db.collection('adPlays').doc(playId).set(adPlay);
};

export const getAdPerformance = async (period: AdPerformanceDataPeriod = 'all'): Promise<AdPerformanceData[]> => {
    if (!db) return [];

    const now = new Date();
    let startTimestamp = 0;
    
    switch (period) {
        case 'today':
            startTimestamp = startOfDay(now).getTime();
            break;
        case 'week':
            startTimestamp = startOfWeek(now, { weekStartsOn: 1 }).getTime(); // Monday as start of week
            break;
        case 'month':
            startTimestamp = startOfMonth(now).getTime();
            break;
        case 'year':
            startTimestamp = startOfYear(now).getTime();
            break;
        case 'all':
        default:
            startTimestamp = 0;
            break;
    }

    let query = db.collection('adPlays');
    if (period !== 'all') {
        query = query.where('playedAt', '>=', startTimestamp) as any;
    }
    
    const adPlaysSnapshot = await query.get();

    if (adPlaysSnapshot.empty) return [];

    const allAds = await getAds();
    const adMap = new Map(allAds.map(ad => [ad.id, ad.name]));

    const performanceMap: Map<string, { totalPlaytime: number; tvs: Set<string>; playCount: number }> = new Map();

    adPlaysSnapshot.docs.forEach(doc => {
        const play = doc.data() as AdPlay;
        
        if (!performanceMap.has(play.adId)) {
            performanceMap.set(play.adId, { totalPlaytime: 0, tvs: new Set(), playCount: 0 });
        }

        const stats = performanceMap.get(play.adId)!;
        stats.totalPlaytime += play.duration;
        stats.tvs.add(play.tvId);
        stats.playCount += 1;
    });

    const performanceData: AdPerformanceData[] = [];
    performanceMap.forEach((stats, adId) => {
        performanceData.push({
            adId,
            adName: adMap.get(adId) || 'Unknown Ad',
            totalPlaytime: stats.totalPlaytime,
            uniqueTvs: stats.tvs.size,
            playCount: stats.playCount,
        });
    });

    return performanceData.sort((a, b) => b.totalPlaytime - a.totalPlaytime);
};
