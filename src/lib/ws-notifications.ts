

// This implementation uses a simple in-memory callback.
// It works because the Next.js app and the WebSocket server now run in the same process.

export type Notification = { type: 'tv', id: string } | { type: 'group', id: string } | { type: 'all-admins' };

let notificationCallback: ((message: Notification) => void) | null = null;

// This function is called by the WebSocket server to register itself as the listener.
export const setNotificationCallback = (callback: (message: Notification) => void) => {
    console.log("WebSocket notification callback has been set.");
    notificationCallback = callback;
};

const sendNotification = (message: Notification) => {
    if (notificationCallback) {
        notificationCallback(message);
    } else {
        // This can happen if an action is called before the WebSocket server has initialized the callback.
        // It's a rare timing issue but good to be aware of.
        console.warn("WebSocket notification callback not set. Notification queueing is disabled.");
    }
};

export const notifyTv = async (tvId: string) => {
    const message: Notification = { type: 'tv', id: tvId };
    sendNotification(message);
}

export const notifyGroup = async (groupId: string) => {
    const message: Notification = { type: 'group', id: groupId };
    sendNotification(message);
}

export const notifyAdmins = async () => {
    const message: Notification = { type: 'all-admins' };
    sendNotification(message);
}
