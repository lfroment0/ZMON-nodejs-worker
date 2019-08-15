import App from './app/app';
import log from './log/log';
import { http } from './plugins/http';

async function main() {
    const app = new App();

    log.info('App Started');
    app.run();
}

main();
