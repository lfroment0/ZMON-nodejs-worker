import * as os from 'os';

export const config = {
    redisHost: process.env.REDIS_HOST || '127.0.0.1',
    redisPort: Number(process.env.REDIS_PORT) || 6379,
    defaultQueue: process.env.DEFAULT_QUEUE || 'zmon:queue:default',
}
