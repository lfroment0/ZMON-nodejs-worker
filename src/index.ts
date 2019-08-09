import { getQueueClient } from './redis/redisHandler';
import { startServer } from './server/server';
import ZmonWorker from './worker/zmon-worker';

// start health endpoint server
startServer()

// connect to redis
const redisClient = getQueueClient();
const queueName = 'zmon:queue:default';

// start worker
const w = new ZmonWorker(redisClient, queueName);
w.startWorker();
