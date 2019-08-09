import { createClient, RedisClient } from 'redis';

export function getQueueClient(host?: string, port?: number): RedisClient {
    let client: RedisClient;
    if (host && port) {
        client = createClient(port, host);
    }
    return createClient();
}

