import { createClient } from 'redis';
import { config } from 'dotenv';

config();

type RedisClient = ReturnType<typeof createClient>;

let publisher: RedisClient | null = null;
let subscriber: RedisClient | null = null;

const redisUrl = process.env.REDIS_URL;

async function getClient(): Promise<RedisClient> {
    if (!redisUrl) {
        throw new Error('REDIS_URL is not defined in the environment variables. Real-time notifications will be disabled.');
    }
    const client = createClient({ url: redisUrl });
    client.on('error', (err) => console.error('Redis Client Error', err));
    await client.connect();
    return client;
}

export async function getPublisher(): Promise<RedisClient> {
    if (!publisher) {
        publisher = await getClient();
    }
    return publisher;
}

export async function getSubscriber(): Promise<RedisClient> {
    if (!subscriber) {
        // Redis requires a separate client for subscribing
        subscriber = await getClient();
    }
    return subscriber;
}

// Graceful shutdown
process.on('SIGINT', async () => {
  if (publisher) await publisher.quit();
  if (subscriber) await subscriber.quit();
  process.exit(0);
});
