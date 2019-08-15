import { http } from '../plugins/http';
import log from '../log/log';

const execCtx = process.env.production === "true" ? {
    http,
} : {
    http,
    JSON,
    log,
};

export default execCtx;
