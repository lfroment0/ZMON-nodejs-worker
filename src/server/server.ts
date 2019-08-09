import {createServer} from 'http';
import express = require('express')
import terminus = require('@godaddy/terminus')
import { createTerminus } from '@godaddy/terminus';

const app = express()

app.get('/', (req, res) => {
    res.send('ok')
})

const server = createServer(app)

function onSignal(): Promise<any> {
    console.log('server is starting cleanup')
    return Promise.all([
       null
    ]);
}

async function onHealthCheck() {
    // checks if the system is healthy, like the db connection is live
    // resolves, if health, rejects if not
}

export function startServer() {
    createTerminus(server, {
        signal: 'SIGINT',
        healthChecks: { '/healthcheck': onHealthCheck },
        onSignal,
    });

    server.listen(3000)
}


