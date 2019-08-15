import { ClientRequest, createServer, ServerResponse } from 'http';
import { createTerminus, TerminusOptions } from '@godaddy/terminus';
import { Express } from 'express';
import express = require('express');

import { RedisService } from '../services/redis-service';
import log from '../log/log';
import ZmonWorker from '../worker/zmon-worker';

export default class ApiServer {
    private app: Express;

    constructor(private worker: ZmonWorker, private redisService: RedisService) {
        this.app = express();
        this.setupRoutes();
    }

    startServer(port: number) {
        const server = createServer(this.app);
        const opt: TerminusOptions = {
            signal: 'SIGINT',
            healthChecks: {'/health': this.onHealthCheck},
            onSignal: this.onSignal,
        };

        createTerminus(server, opt);
        server.listen(port);
        log.info(`server started on port ${port}`)
    }


    private setupRoutes() {
        this.app.get('/', (req, res) => {
            res.send('ok');
        });
    }

    private onSignal() {
        log.info('server is starting cleanup');
        return Promise.all([
            this.worker.stopWorker(),
            this.redisService.terminate()
        ]);
    }

    private onHealthCheck(): Promise<any> {
        log.info('checking health');

        return Promise.all([
            this.redisService.checkHealth()
        ]);
    }
}
