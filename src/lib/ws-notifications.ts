'server-only';
import fs from 'fs/promises';
import path from 'path';

const NOTIFICATION_DIR = path.join(process.cwd(), '.notifications');

const sendNotification = async (payload: object) => {
    try {
        await fs.mkdir(NOTIFICATION_DIR, { recursive: true });
        const fileName = path.join(NOTIFICATION_DIR, `notif-${Date.now()}-${Math.random()}.json`);
        await fs.writeFile(fileName, JSON.stringify(payload));
    } catch (error) {
        console.error('Failed to send WebSocket notification:', error);
    }
}

export const notifyTv = (tvId: string) => {
    console.log(`Queueing notification for TV: ${tvId}`);
    return sendNotification({ type: 'tv', id: tvId });
}

export const notifyGroup = (groupId: string) => {
    console.log(`Queueing notification for Group: ${groupId}`);
    return sendNotification({ type: 'group', id: groupId });
}
