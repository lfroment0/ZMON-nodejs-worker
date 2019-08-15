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
        this.zmonWorker = new ZmonWorker(this.redisService, config.defaultQueue);
        this.server = new ApiServer(this.zmonWorker, this.redisService);
    }

    run() {
        const port = 3000;
        this.server.startServer(port);
        this.zmonWorker.startWorker();
    }
}
