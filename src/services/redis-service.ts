import { createClient, Multi, RedisClient } from 'redis';
import { config } from '../config/config';
import { promisify } from 'util';
import log from '../log/log';


export class RedisService {
    private redisClient: RedisClient;

    // promisified redis client commands

    private brpopAsync: (key: string, nb: number) => Promise<[string, string]>;
    private pingAsync: () => Promise<any>;
    private quitAsync: () => Promise<'OK'>;
    private delAsync: (key: string) => any;
    private msetAsync: (key: string, value: string) => Promise<boolean>;
    private saddAsync: (key: string, value: string) => Promise<number>;
    private setAsync: (key: string, value: string) => Promise<any>;
    private lpushAsync: (key: string, value: string) => Promise<number>;


    constructor() {
        this.redisClient = this.getRedisClient();

        this.brpopAsync = promisify(this.redisClient.brpop).bind(this.redisClient);
        this.pingAsync = promisify(this.redisClient.ping).bind(this.redisClient);
        this.quitAsync = promisify(this.redisClient.quit).bind(this.redisClient);
        this.delAsync = promisify(this.redisClient.del).bind(this.redisClient);
        this.msetAsync = promisify(this.redisClient.mset).bind(this.redisClient);
        this.saddAsync = promisify(this.redisClient.sadd).bind(this.redisClient);
        this.setAsync = promisify(this.redisClient.set).bind(this.redisClient);
        this.lpushAsync = promisify(this.redisClient.lpush).bind(this.redisClient);
    }

    async checkRedisConnection() {
        const res = await this.pingAsync();
        return res === 'PONG';
    }

    private getRedisClient() {
        const {redisHost, redisPort} = config;
        let client: RedisClient;

        if (redisHost && redisPort) {
            client = createClient(redisPort, redisHost);
        } else {
            client = createClient();
        }

        client.on('error', err => {
            log.error(err);
        });


        client.on('message', (key, msg) => {
            log.info(key);
        });
        return client;
    }

    async terminate(): Promise<boolean> {
        this.redisClient.removeAllListeners();

        log.info('stopping connection to redis');
        const res = await this.quitAsync();

        return res === 'OK';
    }

    checkHealth(): Promise<boolean> {
        return this.pingAsync();
    }

    registerWorker(workerName: string): Promise<number>{
        return this.saddAsync('zmon:metrics', workerName);
    }

    unregisterWorker(workerName: string) {
        const checkCountKey = `zmon:metrics:${workerName}:check.count`;
        const lastExecKey = `zmon:metrics:${workerName}:ts`;

        const multiCmd: Multi = this.redisClient.multi();

        multiCmd.srem('zmon:metrics', workerName);
        multiCmd.del(checkCountKey);
        multiCmd.del(lastExecKey);

        multiCmd.exec();
    }

    getTask(queueName: string) {
        return this.brpopAsync(queueName, 0);
    }

    deleteAlert(alertKey: string) {
        return this.delAsync(alertKey)
    }

    setAlert(alertKey: string, value: any) {
        return this.setAsync(alertKey, value);
    }

    storeCheckResult(key: string, value: string) {
        return this.lpushAsync(key, value)
    }

    updateWorkerStatus(workerName: string, executedChecks: number, lastExec: number) {
        const checkCountKey = `zmon:metrics:${workerName}:check.count`;
        const lastExecKey = `zmon:metrics:${workerName}:ts`;

        const multiCmd: Multi = this.redisClient.multi();

        multiCmd.mset(checkCountKey, executedChecks.toString());
        multiCmd.mset(lastExecKey, lastExec.toString());
        multiCmd.exec();
    }
}
