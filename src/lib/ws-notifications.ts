'use server-only';
import fs from 'fs/promises';
import path from 'path';
import { getTvsByGroupId } from './data';

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

export const notifyGroup = async (groupId: string) => {
    console.log(`Queueing notification for Group: ${groupId}`);
    const tvs = await getTvsByGroupId(groupId);
    // The standalone socket server doesn't know about groups,
    // so we must notify each TV in the group individually.
    for (const tv of tvs) {
        await notifyTv(tv.tvId);
    }
}

export const notifyStatusChange = (payload: { tvId: string, isOnline: boolean }) => {
    console.log(`Queueing status change notification for TV: ${payload.tvId}`);
    return sendNotification({ type: 'status-change', payload });
}
