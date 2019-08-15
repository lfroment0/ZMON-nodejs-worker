import { Context, createContext, CreateContextOptions, runInNewContext, RunningScriptOptions } from 'vm';
import log from '../log/log';

const opt: CreateContextOptions = {
    name: 'checkId: xxx',
    codeGeneration: {
        strings: false
    },
};

export async function execZmonScript(ctx: Context, script: string, additionalCtx: {value: any} | {entity: Object}) {
    const scriptToExec = `(${script})();`

    const localCtx = {...ctx, ...additionalCtx};
    const newCtx = createContext(localCtx, opt);

    const t0 = Date.now();
    let result: any;

    try {
        result = runInNewContext(scriptToExec, newCtx);
    } catch (e) {
        result = e;
    }

    const t1 = Date.now();

    return {
        td: t1 - t0,
        result: await result,
        execTime: Date.now() / 1000
    };
}


