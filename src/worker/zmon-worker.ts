import { hostname } from 'os';
import { RedisClient } from 'redis';
import { Context } from 'vm';

import { execZmonScript } from './exec';
import { RedisService } from '../services/redis-service';

import execCtx from '../exec-ctx/ctx';
import log from '../log/log';
import Alert from '../types/Alert';

const UPDATE_INTERVAL = 2000;

export default class ZmonWorker {
    executedChecks = 0;

    private execCtx: Context;
    private workerName: string;

    private lastExec: number = 0;

    private tasks = {
        'check_and_notify': this.checkAndNotify,
        // 'trial_run': trialRun,
        // 'cleanup': cleanup,
    };
    private running = true;

    constructor(private redisService: RedisService, private queueName: string) {
        this.execCtx = execCtx;

        this.queueName = queueName;
        this.workerName = `plocal.${hostname()}`;
        this.register();
    }

    private register() {
        this.redisService.registerWorker(this.workerName);
    }

    private unregister() {
        this.redisService.unregisterWorker(this.workerName);
    }

    stopWorker() {
        this.unregister();
        this.running = false;
    }

    async startWorker() {
        log.info(`starting worker ${this.workerName}`);
        while (this.running) {
            const res: [string, string] = await this.getNextTask()
            this.processTask(res);
        }
    }

    private async processTask(res: [string, string]) {
        const {
            task,
            command,
            entity,
            checkId,
            alertList,
            expires,
        } = this.parseMessage(res);

        if (Date.now() >= new Date(expires).getTime()) {
            log.error(`Task with checkID: ${checkId} expired`);
            return
        }
        const result = await this.handleCheck(command, checkId, entity);

        alertList.forEach((alert: Alert) => {
            this.handleAlerts(alert, result, entity);
        });
    }

    private async handleCheck(command: any, checkId: any, entity: any) {
        const startTime = Date.now();
        const {td, result, execTime} = await this.executeZmonTask(command, checkId, entity);
        this.executedChecks++;

        const checkObj = {
                exc: 1,
                downtimes: [],
                captures: {},
                start_time: startTime,
                worker: this.workerName,
                ts: Date.now() / 1000,
                value: result,
                td,
            };

        this.storeCheckResult(checkId, entity.id, JSON.stringify(checkObj));
    }

    private parseMessage(res: [string, string]) {
        const [_, msg] = res;
        const parsedMsg = JSON.parse(msg);
        const {task, expires} = parsedMsg.body;
        const {check_id: checkId, entity, command} = parsedMsg.body.args[0];
        const alertList: Alert[] = parsedMsg.body.args[1];

        return {
            task,
            command,
            entity,
            checkId,
            alertList,
            expires,
        };
    }

    private async handleAlerts(alert: any, checkResult: any, entity: any) {
        const startTime = Date.now();
        const {td, result, execTime} = await execZmonScript(this.execCtx, alert.condition, {value: checkResult});

        const alertObj = {
            exc: 1,
            downtimes: [],
            captures: {},
            start_time: startTime,
            worker: this.workerName,
            ts: Date.now() / 1000,
            value: checkResult,
            td,
        };

        if (!!result) {
            this.storeAlertResult(alert.id, entity.id, JSON.stringify(alertObj));
        } else {
            this.deleteAlertResult(alert.id, entity.id);
        }
    }

    private getNextTask() {
        return this.redisService.getTask(this.queueName);
    }

    private async executeZmonTask(script: string, checkId: string, entity: any) {
        const {td, result, execTime} = await execZmonScript(execCtx, script, { entity });

        this.lastExec = execTime;

        return {td, result, execTime};
    }

    private checkAndNotify(req: any) {
        // const script = '';
        // const entity = {hello: 'world'};
        // const checkId = req['check_id'];
        // const entityId = req['entity']['id'];
        //
        // execZmonScript(this.execCtx, script, entity)
    }

    private async storeCheckResult(checkId: number, entityId: string, value: string) {
        const key = `zmon:checks:${checkId}:${entityId}`;

        await this.redisService.storeCheckResult(key, value);
    }

    private async storeAlertResult(alertID: number, entityID: string, value: string) {
        const storageName = `zmon:alerts:${alertID}:${entityID}`;

        await this.redisService.setAlert(storageName, value)
    }

    private async deleteAlertResult(alertID: number, entityID: string) {
        const storageName = `zmon:alerts:${alertID}:${entityID}`;

        await this.redisService.deleteAlert(storageName)
    }

    private sendStatusUpdate() {
        log.info('updating worker metrics status');
        this.redisService.updateWorkerStatus(this.workerName, this.executedChecks, this.lastExec);
    }
}
