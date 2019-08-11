import { createClient, RedisClient } from 'redis';
import { config } from '../config/config';
import { promisify } from 'util';


export class RedisService {
    private redisClient: RedisClient;

    // promisified redis client commands
    private brpopAsync: Function;
    private pingAsync: Function;

    constructor() {
        this.redisClient = this.getRedisClient();
        this.brpopAsync = promisify(this.redisClient.brpop).bind(this.redisClient);
        this.pingAsync = promisify(this.redisClient.ping).bind(this.redisClient);

    }

    async checkRedisConnection(): Promise<boolean> {
        return await this.pingAsync();
    }

    private getRedisClient() {
        let client: RedisClient;
        const {redisHost, redisPort} = config;

        if (redisHost && redisPort) {
            client = createClient(redisPort, redisHost);
        } else {
            client = createClient();
        }

        client.on('error', err => {
            console.log("ERR");
            console.error(err);
        });

        return client;
    }

    async terminate(): Promise<boolean> {
        return await this.redisClient.quit();
    }

    async checkHealth(): Promise<boolean> {
        return await this.redisClient.ping();
    }

    registerWorker(workerName: string) {
        this.redisClient.sadd('zmon:metrics', workerName);
    }

    async getTask(queueName: string) {
        return await this.brpopAsync(queueName, 0);
    }

    deleteAlert(alertKey: string) {
        this.redisClient.del(alertKey)
    }

    setAlert(alertKey: string, value: any) {
        this.redisClient.set(alertKey, value);
    }

    storeCheckResult(key: string, value: string) {
        this.redisClient.lpush(key, value)
    }
}
