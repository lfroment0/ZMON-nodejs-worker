import { RedisClient } from 'redis';
import { Context } from 'vm';
import { promisify } from 'util';

import execCtx from '../exec-ctx/ctx';
import { execZmonScript } from './exec';


export default class ZmonWorker {
    private queueConn: RedisClient;
    private execCtx: Context;
    private brpopAsync: Function;
    private queueName: string;

    private tasks = {
        'check_and_notify': this.checkAndNotify,
        // 'trial_run': trialRun,
        // 'cleanup': cleanup,
    };

    constructor(client: RedisClient, queueName: string) {
        this.queueConn = client;
        this.execCtx = execCtx;
        this.brpopAsync = promisify(client.brpop).bind(client);
        this.queueName = queueName;
    }

    async startWorker() {
        console.log('worker started');
        let i = 0;
        while (true) {
            const res = await this.consumeQueue();
            const [queueName, msg] = res;
            const parsedMsg = JSON.parse(msg);
            const {check_id, entity, command} = parsedMsg.body.args[0];
            const alertList = parsedMsg.body.args[1];
            const checkResult = this.executeZmonTask(command, check_id, entity);
            this.storeCheckResult(check_id, entity.id, JSON.stringify(checkResult));
            alertList.forEach((alert: any) => {
                const startTime = Date.now();
                const {td, result: alertRes} = execZmonScript(this.execCtx, alert.condition, {value: checkResult});
                const alertObj = {
                    exc: 1,
                    downtimes: [],
                    captures: {},
                    start_time: startTime,
                    worker: 'nodejs-worker',
                    ts: Date.now(),
                    value: alertRes,
                    td,
                };
                if (!!alertRes) {
                    this.storeAlertResult(alert.id, entity.id, JSON.stringify(alertObj));
                    console.log(`alert ${alert.id} triggered on entity ${entity.id}`);
                } else {
                    this.deleteAlertResult(alert.id, entity.id);
                }
            });
        }
    }

    private async consumeQueue() {
        const checkId = '';
        const entityId = '';
        return await this.brpopAsync(this.queueName, 0);
    }

    private executeZmonTask(checkScript: string, checkId: string, entity: any): any {

        const {td, result} = execZmonScript(execCtx, checkScript, {entity});
        return result;

    }

    private checkAndNotify(req: any) {
        console.log(req);
        // const script = '';
        // const entity = {hello: 'world'};
        // const checkId = req['check_id'];
        // const entityId = req['entity']['id'];
        //
        // execZmonScript(this.execCtx, script, entity)
    }

    private storeCheckResult(checkId: number, entityId: string, res: string) {
        const key = `zmon:checks:${checkId}:${entityId}`;
        this.queueConn.lpush(key, res, console.log);
        this.queueConn.ltrim(key, 0, 20 - 1);
    }

    private storeAlertResult(alertID: number, entityID: string, value: string) {
        const storageName = `zmon:alerts:${alertID}:${entityID}`;

        this.queueConn.set(storageName, value, console.log);
    }

    private deleteAlertResult(alertID: number, entityID: string) {
        const storageName = `zmon:alerts:${alertID}:${entityID}`;

        this.queueConn.del(storageName, console.log);
    }
}
