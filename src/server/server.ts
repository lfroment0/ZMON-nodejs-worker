import { createServer } from 'http';
import { createTerminus, TerminusOptions } from '@godaddy/terminus';
import { Express } from 'express';
import express = require('express');
import { RedisService } from '../services/redis-service';

export default class ApiServer {
    app: Express;

    constructor(private redisService: RedisService) {
        this.app = express();
        this.setupRoutes();
    }

    startServer() {
        const server = createServer(this.app);
        const opt: TerminusOptions = {
            signal: 'SIGINT',
            healthChecks: {'/healthcheck': this.onHealthCheck},
            onSignal: this.onSignal,
        };

        createTerminus(server, opt);
        server.listen(3000);
    }


    private setupRoutes() {
        this.app.get('/', (req, res) => {
            res.send('ok');
        });
    }

    private onSignal() {
        console.log('server is starting cleanup');
        return Promise.all([
            this.redisService.terminate()
        ]);
    }

    private onHealthCheck(): Promise<any> {
        console.log('checking worker health');
        return Promise.all([
            this.redisService.checkHealth()
        ]);
    }
}
