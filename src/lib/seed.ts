'server-only';
import { db } from './firebase';

export const seedInitialData = async () => {
    if (!db) {
        console.warn("Skipping seed: Firestore is not initialized.");
        return;
    }
    
    try {
        console.log('Checking for existing data...');
        const adsSnapshot = await db.collection('ads').limit(1).get();

        if (!adsSnapshot.empty) {
            console.log('Data already exists. Skipping seed.');
            return;
        }

        console.log('No data found. Seeding initial data...');
        const batch = db.batch();

        // Seed Ads
        const adsToCreate = [
            { id: 'ad-1', name: 'Abstract Art Ad', type: 'image', url: "https://images.unsplash.com/photo-1533157950006-c38844053d55?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw3fHxhYnN0cmFjdCUyMGFydHxlbnwwfHx8fDE3NTg2MDQxMTR8MA&ixlib=rb-4.1.0&q=80&w=1080", duration: 15 },
            { id: 'ad-2', name: 'Big Buck Bunny Video', type: 'video', url: 'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4' },
            { id: 'ad-3', name: 'Night Cityscape Ad', type: 'image', url: "https://images.unsplash.com/photo-1690937956164-29ef80d706cb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw3fHxjaXR5c2NhcGUlMjBuaWdodHxlbnwwfHx8fDE3NTg1OTg3Mjd8MA&ixlib=rb-4.1.0&q=80&w=1080", duration: 10 },
            { id: 'ad-4', name: 'Forest Nature Ad', type: 'image', url: "https://images.unsplash.com/photo-1425913397330-cf8af2ff40a1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwzfHxuYXR1cmUlMjBmb3Jlc3R8ZW58MHx8fHwxNzU4Njg0MDc3fDA&ixlib=rb-4.1.0&q=80&w=1080", duration: 20 },
        ];
        adsToCreate.forEach(ad => {
            const adRef = db.collection('ads').doc(ad.id);
            batch.set(adRef, ad);
        });

        // Seed Playlists
        const playlistsToCreate = [
            { id: 'playlist-lobby', name: 'Lobby Playlist', adIds: ['ad-1', 'ad-2'] },
            { id: 'playlist-cafe', name: 'Cafe Playlist', adIds: ['ad-3'] },
        ];
        playlistsToCreate.forEach(pl => {
            const plRef = db.collection('playlists').doc(pl.id);
            batch.set(plRef, pl);
        });
        
        // Seed TV Groups
        const groupsToCreate = [
            { id: 'group-lobby', name: 'Lobby', playlistId: 'playlist-lobby', priorityStream: null },
            { id: 'group-cafe', name: 'Cafe', playlistId: 'playlist-cafe', priorityStream: null },
            { id: 'group-empty', name: 'Empty Group', playlistId: null, priorityStream: null },
        ];
        groupsToCreate.forEach(group => {
            const groupRef = db.collection('groups').doc(group.id);
            batch.set(groupRef, group);
        });

        // Seed TVs
        const tvsToCreate = [
            { tvId: 'tv-lobby-main-001', name: 'Lobby Main TV', groupId: 'group-lobby' },
            { tvId: 'tv-lobby-side-002', name: 'Lobby Side TV', groupId: 'group-lobby' },
            { tvId: 'tv-cafe-menu-001', name: 'Cafe Menu Board', groupId: 'group-cafe' },
            { tvId: 'tv-conf-room-A-001', name: 'Conference Room A', groupId: null },
            { tvId: 'tv-break-room-001', name: 'Break Room TV', groupId: null },
        ];
        tvsToCreate.forEach(tv => {
            const tvRef = db.collection('tvs').doc(tv.tvId);
            batch.set(tvRef, { ...tv, socketId: `socket-fake-${Math.random()}` });
        });

        await batch.commit();
        console.log('Initial data seeded successfully!');
    } catch (error) {
        console.error("Error seeding data:", error);
    }
};
