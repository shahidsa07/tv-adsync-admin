'server-only';
import { getTvsByGroupId } from './data';

// This is a simplified in-memory "queue" for demonstration.
// In a real, scalable production environment, you would use a proper message queue
// like Google Cloud Pub/Sub, Redis Pub/Sub, or another message broker.
type Notification = { type: 'tv', id: string } | { type: 'group', id: string } | { type: 'all-admins' };
let notificationCallback: ((notification: Notification) => void) | null = null;

export function setNotificationCallback(callback: (notification: Notification) => void) {
    notificationCallback = callback;
}

const sendNotification = async (notification: Notification) => {
    if (notificationCallback) {
        if (notification.type === 'group') {
            try {
                const tvs = await getTvsByGroupId(notification.id);
                tvs.forEach(tv => {
                    if (notificationCallback) {
                        notificationCallback({ type: 'tv', id: tv.tvId });
                    }
                });
            } catch (error) {
                 console.error(`Failed to get TVs for group ${notification.id}`, error);
            }
        } else {
             notificationCallback(notification);
        }
    } else {
        console.warn('WebSocket notification callback not set. Notification queueing is disabled.');
    }
};

export const notifyTv = (tvId: string) => {
    console.log(`Queueing notification for TV: ${tvId}`);
    return sendNotification({ type: 'tv', id: tvId });
}

export const notifyGroup = (groupId: string) => {
    console.log(`Queueing notification for Group: ${groupId}`);
    return sendNotification({ type: 'group', id: groupId });
}

export const notifyAdmins = () => {
    console.log('Queueing notification for all admins');
    return sendNotification({ type: 'all-admins' });
}
