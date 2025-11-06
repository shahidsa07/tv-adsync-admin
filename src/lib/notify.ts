'use server';

/**
 * This function sends a notification to a specific TV via the WebSocket server.
 * It is designed to be called from Server Actions.
 */
export async function notifyTv(tvId: string) {
    // This is an internal call from the Next.js server to the WebSocket server.
    // They are separate processes, but live on the same machine.
    const wsNotifyUrl = 'http://localhost:8081/notify';

    try {
        const response = await fetch(wsNotifyUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ tvId }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to notify WebSocket server for TV ${tvId}. Status: ${response.status}. Body: ${errorText}`);
        }

        console.log(`[Notification] Successfully requested refresh for TV: ${tvId}`);
        return { success: true };

    } catch (error) {
        console.error(`[Notification] Error notifying TV ${tvId}:`, error);
        // We don't bubble this error up to the UI, as the primary action (DB update) succeeded.
        // This is a secondary, non-critical failure.
        return { success: false };
    }
}
