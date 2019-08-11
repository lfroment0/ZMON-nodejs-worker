import { RedisService } from '../services/redis-service';
import ZmonWorker from '../worker/zmon-worker';
import { config } from '../config/config';
import ApiServer from '../server/server';

export default class App {
    redisService: RedisService;
    zmonWorker: ZmonWorker;
    server: ApiServer;

    constructor() {
        this.redisService = new RedisService();
        this.server = new ApiServer(this.redisService);
        this.zmonWorker = new ZmonWorker(this.redisService, config.defaultQueue);
    }

    run() {
        this.server.startServer();
        this.zmonWorker.startWorker();
    }
}
