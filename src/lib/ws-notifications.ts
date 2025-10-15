'use server';
import fs from 'fs/promises';
import path from 'path';

// Note: This implementation uses the local filesystem as a simple message queue.
// In a scaled-out or serverless environment, a more robust solution like Redis Pub/Sub would be required.

const NOTIFICATION_DIR = path.join(process.cwd(), '.notifications');

// This function is called from server actions.
// It "queues" a notification by writing a small file to a directory that the WebSocket server watches.
const queueNotification = async (message: Notification) => {
    try {
        await fs.mkdir(NOTIFICATION_DIR, { recursive: true });
        const fileName = `${message.type}_${'id' in message ? message.id : 'all'}_${Date.now()}.json`;
        const filePath = path.join(NOTIFICATION_DIR, fileName);
        await fs.writeFile(filePath, JSON.stringify(message));
        console.log(`Queued file notification: ${fileName}`);
    } catch (error) {
        console.error('Error queueing file notification:', error);
    }
};

export type Notification = { type: 'tv', id: string } | { type: 'group', id: string } | { type: 'all-admins' };

export const notifyTv = async (tvId: string) => {
    const message: Notification = { type: 'tv', id: tvId };
    await queueNotification(message);
}

export const notifyGroup = async (groupId: string) => {
    const message: Notification = { type: 'group', id: groupId };
    await queueNotification(message);
}

export const notifyAdmins = async () => {
    const message: Notification = { type: 'all-admins' };
    await queueNotification(message);
}
