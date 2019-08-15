import * as winston from 'winston';

const log = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
});

if (process.env.NODE_ENV !== 'production') {
    log.add(new winston.transports.Console({
        format: winston.format.simple()
    }));
}

export default log;
