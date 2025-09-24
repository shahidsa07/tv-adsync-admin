import { db } from './firebase';

const seedInitialData = async () => {
    console.log('Checking for existing data...');
    const tvsSnapshot = await db.collection('tvs').get();
    const groupsSnapshot = await db.collection('groups').get();

    if (!tvsSnapshot.empty || !groupsSnapshot.empty) {
        console.log('Data already exists. Skipping seed.');
        return;
    }

    console.log('No data found. Seeding initial data...');
    const batch = db.batch();

    const tvsToCreate = [
        { tvId: 'tv-lobby-main-001', name: 'Lobby Main TV', groupId: 'group-lobby' },
        { tvId: 'tv-lobby-side-002', name: 'Lobby Side TV', groupId: 'group-lobby' },
        { tvId: 'tv-cafe-menu-001', name: 'Cafe Menu Board', groupId: 'group-cafe' },
        { tvId: 'tv-conf-room-A-001', name: 'Conference Room A', groupId: null },
        { tvId: 'tv-break-room-001', name: 'Break Room TV', groupId: null },
    ];
    
    tvsToCreate.forEach(tv => {
        const tvRef = db.collection('tvs').doc(tv.tvId);
        batch.set(tvRef, { ...tv, socketId: null });
    });

    const groupsToCreate = [
        { 
            id: 'group-lobby', 
            name: 'Lobby', 
            ads: [
                { id: 'ad-1', type: 'image', url: "https://images.unsplash.com/photo-1533157950006-c38844053d55?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw3fHxhYnN0cmFjdCUyMGFydHxlbnwwfHx8fDE3NTg2MDQxMTR8MA&ixlib=rb-4.1.0&q=80&w=1080", order: 1, duration: 15 },
                { id: 'ad-2', type: 'video', url: 'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4', order: 2 },
            ], 
            priorityStream: null 
        },
        { 
            id: 'group-cafe', 
            name: 'Cafe', 
            ads: [
                { id: 'ad-3', type: 'image', url: "https://images.unsplash.com/photo-1690937956164-29ef80d706cb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw3fHxjaXR5c2NhcGUlMjBuaWdodHxlbnwwfHx8fDE3NTg1OTg3Mjd8MA&ixlib=rb-4.1.0&q=80&w=1080", order: 1, duration: 10 },
            ], 
            priorityStream: null 
        },
    ];

    groupsToCreate.forEach(group => {
        const groupRef = db.collection('groups').doc(group.id);
        batch.set(groupRef, group);
    });

    await batch.commit();
    console.log('Initial data seeded successfully!');
};

seedInitialData().catch(error => {
    console.error('Failed to seed initial data:', error);
    process.exit(1);
});
