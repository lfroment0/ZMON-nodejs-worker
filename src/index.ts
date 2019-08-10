import { getQueueClient } from './redis/redisHandler';
import { startServer } from './server/server';
import ZmonWorker from './worker/zmon-worker';
import { config } from './config/config';

// start health endpoint server
const redisClient = getQueueClient(config.redisHost, config.redisPort);

const cb = () => {
    console.log('\nterminate Redis connection');
    redisClient.end();
}

startServer(cb);

// start worker
const w = new ZmonWorker(redisClient, config.defaultQueue);
w.startWorker();
