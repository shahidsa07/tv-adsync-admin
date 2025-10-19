"use strict";
'server-only';
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAdPerformance = exports.createAdPlay = exports.setAnalyticsSettings = exports.getAnalyticsSettings = exports.deletePlaylist = exports.updatePlaylist = exports.createPlaylist = exports.deleteAd = exports.updateAd = exports.createAd = exports.updatePriorityStream = exports.updateGroupTvs = exports.deleteGroup = exports.updateGroup = exports.createGroup = exports.setTvOnlineStatus = exports.deleteTv = exports.updateTv = exports.createTv = exports.getPlaylistsContainingAd = exports.getGroupsByPlaylistId = exports.getTvsByGroupId = exports.getPlaylistById = exports.getGroupById = exports.getTvById = exports.getAds = exports.getPlaylists = exports.getGroups = exports.getTvs = void 0;
const firebase_1 = require("@/lib/firebase");
const firestore_1 = require("firebase-admin/firestore");
const date_fns_1 = require("date-fns");
// --- GETTERS ---
const getTvs = async () => {
    if (!firebase_1.db)
        return [];
    const snapshot = await firebase_1.db.collection("tvs").get();
    return snapshot.docs.map(doc => doc.data());
};
exports.getTvs = getTvs;
const getGroups = async () => {
    if (!firebase_1.db)
        return [];
    const snapshot = await firebase_1.db.collection("groups").get();
    return snapshot.docs.map(doc => doc.data());
};
exports.getGroups = getGroups;
const getPlaylists = async () => {
    if (!firebase_1.db)
        return [];
    const snapshot = await firebase_1.db.collection("playlists").get();
    return snapshot.docs.map(doc => doc.data());
};
exports.getPlaylists = getPlaylists;
const getAds = async () => {
    if (!firebase_1.db)
        return [];
    const snapshot = await firebase_1.db.collection("ads").get();
    return snapshot.docs.map(doc => doc.data());
};
exports.getAds = getAds;
const getTvById = async (tvId) => {
    if (!firebase_1.db)
        return undefined;
    const docSnap = await firebase_1.db.collection("tvs").doc(tvId).get();
    return docSnap.exists ? docSnap.data() : undefined;
};
exports.getTvById = getTvById;
const getGroupById = async (groupId) => {
    if (!firebase_1.db)
        return undefined;
    const docSnap = await firebase_1.db.collection("groups").doc(groupId).get();
    return docSnap.exists ? docSnap.data() : undefined;
};
exports.getGroupById = getGroupById;
const getPlaylistById = async (playlistId) => {
    if (!firebase_1.db)
        return undefined;
    const docSnap = await firebase_1.db.collection("playlists").doc(playlistId).get();
    return docSnap.exists ? docSnap.data() : undefined;
};
exports.getPlaylistById = getPlaylistById;
const getTvsByGroupId = async (groupId) => {
    if (!firebase_1.db)
        return [];
    const snapshot = await firebase_1.db.collection("tvs").where("groupId", "==", groupId).get();
    return snapshot.docs.map(doc => doc.data());
};
exports.getTvsByGroupId = getTvsByGroupId;
const getGroupsByPlaylistId = async (playlistId) => {
    if (!firebase_1.db)
        return [];
    const snapshot = await firebase_1.db.collection('groups').where('playlistId', '==', playlistId).get();
    return snapshot.docs.map(doc => doc.data());
};
exports.getGroupsByPlaylistId = getGroupsByPlaylistId;
const getPlaylistsContainingAd = async (adId) => {
    if (!firebase_1.db)
        return [];
    const snapshot = await firebase_1.db.collection('playlists').where('adIds', 'array-contains', adId).get();
    return snapshot.docs.map(doc => doc.data());
};
exports.getPlaylistsContainingAd = getPlaylistsContainingAd;
// --- MUTATIONS ---
// TV Mutations
const createTv = async (tvId, name, shopLocation) => {
    if (!firebase_1.db)
        return undefined;
    const newTv = { tvId, name: name || tvId, groupId: null, socketId: null };
    if (shopLocation) {
        newTv.shopLocation = shopLocation;
    }
    await firebase_1.db.collection("tvs").doc(tvId).set(newTv);
    return newTv;
};
exports.createTv = createTv;
const updateTv = async (tvId, data) => {
    if (!firebase_1.db)
        return undefined;
    const docRef = firebase_1.db.collection("tvs").doc(tvId);
    await docRef.update(data);
    const docSnap = await docRef.get();
    return docSnap.data();
};
exports.updateTv = updateTv;
const deleteTv = async (tvId) => {
    if (!firebase_1.db)
        return false;
    await firebase_1.db.collection("tvs").doc(tvId).delete();
    return true;
};
exports.deleteTv = deleteTv;
const setTvOnlineStatus = async (tvId, isOnline, socketId) => {
    if (!firebase_1.db)
        return undefined;
    const docRef = firebase_1.db.collection("tvs").doc(tvId);
    // Check if the document exists before trying to update it
    const docSnap = await docRef.get();
    if (!docSnap.exists) {
        console.log(`TV ${tvId} not found in database, skipping status update.`);
        return undefined;
    }
    await docRef.update({ socketId });
    // Re-fetch the document to return the updated state
    const updatedDocSnap = await docRef.get();
    return updatedDocSnap.data();
};
exports.setTvOnlineStatus = setTvOnlineStatus;
// Group Mutations
const createGroup = async (name) => {
    if (!firebase_1.db)
        return undefined;
    const id = `group-${Date.now()}`;
    const docRef = firebase_1.db.collection("groups").doc(id);
    const newGroup = { id, name, playlistId: null, priorityStream: null };
    await docRef.set(newGroup);
    return newGroup;
};
exports.createGroup = createGroup;
const updateGroup = async (groupId, data) => {
    if (!firebase_1.db)
        return undefined;
    const docRef = firebase_1.db.collection("groups").doc(groupId);
    await docRef.update(data);
    const docSnap = await docRef.get();
    return docSnap.data();
};
exports.updateGroup = updateGroup;
const deleteGroup = async (groupId) => {
    if (!firebase_1.db)
        return false;
    await firebase_1.db.collection("groups").doc(groupId).delete();
    return true;
};
exports.deleteGroup = deleteGroup;
const updateGroupTvs = async (groupId, tvIds) => {
    if (!firebase_1.db)
        return false;
    const batch = firebase_1.db.batch();
    const snapshot = await firebase_1.db.collection("tvs").where("groupId", "==", groupId).get();
    snapshot.forEach(docSnap => {
        if (!tvIds.includes(docSnap.id)) {
            batch.update(docSnap.ref, { groupId: null });
        }
    });
    for (const tvId of tvIds) {
        const tvRef = firebase_1.db.collection("tvs").doc(tvId);
        batch.update(tvRef, { groupId });
    }
    await batch.commit();
    return true;
};
exports.updateGroupTvs = updateGroupTvs;
const updatePriorityStream = async (groupId, stream) => {
    if (!firebase_1.db)
        return undefined;
    const groupRef = firebase_1.db.collection("groups").doc(groupId);
    await groupRef.update({ priorityStream: stream });
    const docSnap = await groupRef.get();
    return docSnap.data();
};
exports.updatePriorityStream = updatePriorityStream;
// Ad Mutations
const createAd = async (name, type, url, duration, tags) => {
    if (!firebase_1.db)
        return undefined;
    const id = `ad-${Date.now()}`;
    const newAd = { id, name, type, url, tags: tags || [] };
    if (type === 'image' && duration) {
        newAd.duration = duration;
    }
    await firebase_1.db.collection("ads").doc(id).set(newAd);
    return newAd;
};
exports.createAd = createAd;
const updateAd = async (adId, data) => {
    if (!firebase_1.db)
        return undefined;
    const docRef = firebase_1.db.collection("ads").doc(adId);
    const updateData = Object.assign({}, data);
    if (data.type === 'video') {
        // Ensure duration is removed for videos
        updateData.duration = firestore_1.FieldValue.delete();
    }
    await docRef.update(updateData);
    const docSnap = await docRef.get();
    return docSnap.data();
};
exports.updateAd = updateAd;
const deleteAd = async (adId) => {
    if (!firebase_1.db)
        return false;
    const batch = firebase_1.db.batch();
    const adRef = firebase_1.db.collection("ads").doc(adId);
    batch.delete(adRef);
    // Remove the ad from all playlists that contain it
    const playlistsSnapshot = await firebase_1.db.collection("playlists").where("adIds", "array-contains", adId).get();
    playlistsSnapshot.forEach(doc => {
        const playlistRef = firebase_1.db.collection("playlists").doc(doc.id);
        batch.update(playlistRef, { adIds: firestore_1.FieldValue.arrayRemove(adId) });
    });
    await batch.commit();
    return true;
};
exports.deleteAd = deleteAd;
// Playlist Mutations
const createPlaylist = async (name) => {
    if (!firebase_1.db)
        return undefined;
    const id = `playlist-${Date.now()}`;
    const newPlaylist = { id, name, adIds: [] };
    await firebase_1.db.collection("playlists").doc(id).set(newPlaylist);
    return newPlaylist;
};
exports.createPlaylist = createPlaylist;
const updatePlaylist = async (playlistId, data) => {
    if (!firebase_1.db)
        return undefined;
    const docRef = firebase_1.db.collection("playlists").doc(playlistId);
    await docRef.update(data);
    const docSnap = await docRef.get();
    return docSnap.data();
};
exports.updatePlaylist = updatePlaylist;
const deletePlaylist = async (playlistId) => {
    if (!firebase_1.db)
        return false;
    const batch = firebase_1.db.batch();
    const playlistRef = firebase_1.db.collection("playlists").doc(playlistId);
    batch.delete(playlistRef);
    // Unset this playlist from any groups that are using it.
    const groupsSnapshot = await firebase_1.db.collection('groups').where('playlistId', '==', playlistId).get();
    groupsSnapshot.forEach(doc => {
        const groupRef = firebase_1.db.collection('groups').doc(doc.id);
        batch.update(groupRef, { playlistId: null });
    });
    await batch.commit();
    return true;
};
exports.deletePlaylist = deletePlaylist;
// --- ANALYTICS ---
const getAnalyticsSettings = async () => {
    if (!firebase_1.db)
        return { isTrackingEnabled: false };
    const docRef = firebase_1.db.collection('settings').doc('analytics');
    const docSnap = await docRef.get();
    if (docSnap.exists) {
        return docSnap.data();
    }
    // Default to disabled if not set
    return { isTrackingEnabled: false };
};
exports.getAnalyticsSettings = getAnalyticsSettings;
const setAnalyticsSettings = async (settings) => {
    if (!firebase_1.db)
        return false;
    await firebase_1.db.collection('settings').doc('analytics').set(settings, { merge: true });
    return true;
};
exports.setAnalyticsSettings = setAnalyticsSettings;
const createAdPlay = async (adId, tvId, duration) => {
    if (!firebase_1.db)
        return;
    const tv = await (0, exports.getTvById)(tvId);
    const playId = `play-${Date.now()}`;
    const adPlay = {
        id: playId,
        adId,
        tvId,
        groupId: (tv === null || tv === void 0 ? void 0 : tv.groupId) || null,
        playedAt: Date.now(),
        duration,
    };
    await firebase_1.db.collection('adPlays').doc(playId).set(adPlay);
};
exports.createAdPlay = createAdPlay;
const getAdPerformance = async (period = 'all') => {
    if (!firebase_1.db)
        return [];
    const now = new Date();
    let startTimestamp = 0;
    switch (period) {
        case 'today':
            startTimestamp = (0, date_fns_1.startOfDay)(now).getTime();
            break;
        case 'week':
            startTimestamp = (0, date_fns_1.startOfWeek)(now, { weekStartsOn: 1 }).getTime(); // Monday as start of week
            break;
        case 'month':
            startTimestamp = (0, date_fns_1.startOfMonth)(now).getTime();
            break;
        case 'year':
            startTimestamp = (0, date_fns_1.startOfYear)(now).getTime();
            break;
        case 'all':
        default:
            startTimestamp = 0;
            break;
    }
    let query = firebase_1.db.collection('adPlays');
    if (period !== 'all') {
        query = query.where('playedAt', '>=', startTimestamp);
    }
    const adPlaysSnapshot = await query.get();
    if (adPlaysSnapshot.empty)
        return [];
    const allAds = await (0, exports.getAds)();
    const adMap = new Map(allAds.map(ad => [ad.id, ad.name]));
    const performanceMap = new Map();
    adPlaysSnapshot.docs.forEach(doc => {
        const play = doc.data();
        if (!performanceMap.has(play.adId)) {
            performanceMap.set(play.adId, { totalPlaytime: 0, tvs: new Set(), playCount: 0 });
        }
        const stats = performanceMap.get(play.adId);
        stats.totalPlaytime += play.duration;
        stats.tvs.add(play.tvId);
        stats.playCount += 1;
    });
    const performanceData = [];
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
exports.getAdPerformance = getAdPerformance;
