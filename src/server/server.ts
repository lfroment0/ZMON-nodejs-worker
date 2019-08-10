import {createServer} from 'http';
import express = require('express')
import terminus = require('@godaddy/terminus')
import { createTerminus } from '@godaddy/terminus';

const app = express()

app.get('/', (req, res) => {
    res.send('ok')
});

const server = createServer(app)

function onSignal(cb: () => any):  () => Promise<any>{
    console.log('server is starting cleanup');
    return function (): Promise<any> {
        return Promise.all([
            cb()
        ]);
    }
}

async function onHealthCheck() {
    // checks if the system is healthy, like the db connection is live
    // resolves, if health, rejects if not
}

export function startServer(cb: () => any) {
    createTerminus(server, {
        signal: 'SIGINT',
        healthChecks: { '/healthcheck': onHealthCheck },
        onSignal: onSignal(cb),
    });

    server.listen(3000)
}


