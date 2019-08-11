import { hostname } from 'os';
import { RedisClient } from 'redis';
import { Context } from 'vm';
import { promisify } from 'util';

import { execZmonScript } from './exec';
import execCtx from '../exec-ctx/ctx';
import { RedisService } from '../services/redis-service';


export default class ZmonWorker {
    executedChecks = 0;

    private execCtx: Context;
    private workerName: string;

    private tasks = {
        'check_and_notify': this.checkAndNotify,
        // 'trial_run': trialRun,
        // 'cleanup': cleanup,
    };

    constructor(private redisService: RedisService, private queueName: string) {
        this.execCtx = execCtx;

        this.queueName = queueName;
        this.workerName = `plocal.${hostname()}`;
        this.registerWorker();
    }

    private registerWorker() {
        this.redisService.registerWorker(this.workerName);
    }

    async startWorker() {
        console.log('worker started');
        let i = 0;
        while (true) {
            const res: [string, string] = await this.consumeQueue();
            this.processMessage(res);
        }
    }

    private processMessage(res: [string, string]) {
        const [_, msg] = res;
        const parsedMsg = JSON.parse(msg);
        const {check_id, entity, command} = parsedMsg.body.args[0];
        const alertList = parsedMsg.body.args[1];

        const checkResult = this.executeZmonTask(command, check_id, entity);
        this.executedChecks++;

        this.storeCheckResult(check_id, entity.id, JSON.stringify(checkResult));

        alertList.forEach((alert: any) => {
            this.handleAlerts(alert, checkResult, entity);
        });
    }

    private handleAlerts(alert: any, checkResult: any, entity: any) {
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
    }

    private consumeQueue() {
        return this.redisService.getTask(this.queueName);
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

    private storeCheckResult(checkId: number, entityId: string, value: string) {
        const key = `zmon:checks:${checkId}:${entityId}`;

        this.redisService.storeCheckResult(key, value);
    }

    private storeAlertResult(alertID: number, entityID: string, value: string) {
        const storageName = `zmon:alerts:${alertID}:${entityID}`;

        this.redisService.setAlert(storageName, value);
    }

    private deleteAlertResult(alertID: number, entityID: string) {
        const storageName = `zmon:alerts:${alertID}:${entityID}`;

        this.redisService.deleteAlert(storageName);
    }
}
