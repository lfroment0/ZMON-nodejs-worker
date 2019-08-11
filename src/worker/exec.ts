import { Context, createContext, CreateContextOptions, runInNewContext, RunningScriptOptions } from 'vm';
import { performance } from 'perf_hooks';

const opt: CreateContextOptions = {
    name: 'checkId: xxx',
    codeGeneration: {
        strings: false
    },
};

export function execZmonScript(ctx: Context, script: string, additionalCtx: {value: any} | {entity: Object}) {
    const scriptToExec = `(${script})();`

    const localCtx = {...ctx, ...additionalCtx};
    const newCtx = createContext(localCtx, opt);

    const t0 = Date.now();

    const result = runInNewContext(scriptToExec, newCtx);

    const t1 = Date.now();

    return {
        td: t1 - t0,
        result,
    };
}


