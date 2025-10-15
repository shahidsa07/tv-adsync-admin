'use server';
import fs from 'fs/promises';
import path from 'path';

// This is a placeholder for the actual callback function that will send the message
// over a WebSocket connection.
let notificationCallback: ((message: any) => void) | null = null;

// This function is called by the WebSocket server to set the callback.
export const setNotificationCallback = (callback: (message: any) => void) => {
    console.log("WebSocket notification callback has been set.");
    notificationCallback = callback;
};

export const getNotificationCallback = () => {
    return notificationCallback;
}

const NOTIFICATION_DIR = path.join(process.cwd(), '.notifications');

// This function is called from server actions.
// It queues a notification by writing a file.
const queueNotification = async (message: any) => {
    try {
        await fs.mkdir(NOTIFICATION_DIR, { recursive: true });
        const fileName = `${message.type}-${message.id}-${Date.now()}.json`;
        const filePath = path.join(NOTIFICATION_DIR, fileName);
        await fs.writeFile(filePath, JSON.stringify(message));
        console.log(`Queued notification: ${fileName}`);
    } catch (error) {
        console.error('Error queueing notification:', error);
    }
};

export type Notification = { type: 'tv', id: string } | { type: 'group', id: string } | { type: 'all-admins' };


export const notifyTv = async (tvId: string) => {
    const message: Notification = { type: 'tv', id: tvId };
    console.log(`Queueing notification for TV: ${tvId}`);
    if (notificationCallback) {
        notificationCallback(message);
    } else {
        console.log("WebSocket notification callback not set. Notification queueing is disabled.");
    }
}

export const notifyGroup = async (groupId: string) => {
    const message: Notification = { type: 'group', id: groupId };
    console.log(`Queueing notification for Group: ${groupId}`);
    if (notificationCallback) {
        notificationCallback(message);
    } else {
         console.log("WebSocket notification callback not set. Notification queueing is disabled.");
    }
}

export const notifyAdmins = async () => {
    const message: Notification = { type: 'all-admins' };
    console.log('Queueing notification for all admins');
     if (notificationCallback) {
        notificationCallback(message);
    } else {
         console.log("WebSocket notification callback not set. Notification queueing is disabled.");
    }
}
