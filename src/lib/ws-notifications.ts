'use server';
import { getPublisher } from './redis';

const NOTIFICATION_CHANNEL = 'ws-notifications';

export type Notification = { type: 'tv', id: string } | { type: 'group', id: string } | { type: 'all-admins' };

export const notifyTv = async (tvId: string) => {
    try {
        const publisher = await getPublisher();
        const notification: Notification = { type: 'tv', id: tvId };
        await publisher.publish(NOTIFICATION_CHANNEL, JSON.stringify(notification));
        console.log(`Published notification for TV: ${tvId}`);
    } catch (error) {
        console.error('Failed to publish TV notification to Redis:', error);
    }
}

export const notifyGroup = async (groupId: string) => {
    try {
        const publisher = await getPublisher();
        const notification: Notification = { type: 'group', id: groupId };
        await publisher.publish(NOTIFICATION_CHANNEL, JSON.stringify(notification));
        console.log(`Published notification for Group: ${groupId}`);
    } catch (error) {
        console.error('Failed to publish Group notification to Redis:', error);
    }
}

export const notifyAdmins = async () => {
     try {
        const publisher = await getPublisher();
        const notification: Notification = { type: 'all-admins' };
        await publisher.publish(NOTIFICATION_CHANNEL, JSON.stringify(notification));
        console.log('Published notification for all admins');
    } catch (error) {
        console.error('Failed to publish admin notification to Redis:', error);
    }
}
