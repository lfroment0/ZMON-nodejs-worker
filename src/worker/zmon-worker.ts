import { RedisClient } from 'redis';
import { execCheck } from './exec';
import execCtx from '../exec-ctx/ctx';
import { Context } from 'vm';

export default class ZmonWorker {
    private queueName: string
    private queueConn: RedisClient;
    private execCtx: Context;
    private tasks = {
        'check_and_notify': this.checkAndNotify,
        // 'trial_run': trialRun,
        // 'cleanup': cleanup,
    }

    constructor(client: RedisClient, queueName: string) {
        this.queueConn = client;
        this.queueName = queueName;
        this.execCtx = execCtx;
    }

    startWorker() {
        console.log("worker started")
        this.consumeQueue();
        // while (true) {
            // this.consumeQueue();
        // }
    }

    consumeQueue() {
        this.queueConn.brpop(this.queueName, 0, this.executeZmonTask);
    }

    executeZmonTask(err: Error | null, res: [string, string]) {
        if (err !== null) {
            return err;
        }

        const [queueName, msg] = res;
        console.log(msg);
    }

    checkAndNotify(req: any) {
        console.log(req);
        // const script = '';
        // const entity = {hello: 'world'};
        // const checkId = req['check_id'];
        // const entityId = req['entity']['id'];
        //
        // execCheck(this.execCtx, script, entity)
    }
}
