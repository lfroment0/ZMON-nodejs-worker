import { Context, createContext, CreateContextOptions, runInNewContext, RunningScriptOptions } from 'vm';

export function execCheck(ctx: Context, checkDefinition: string, entity: any) {
    const script = `(${checkDefinition})();`
    const opt: CreateContextOptions = {
        name: 'checkId: xxx',
        codeGeneration: {
            strings: false
        },
    };

    const localCtx = {...ctx, entity};
    const newCtx = createContext(localCtx, opt);

    return runInNewContext(script, newCtx);
}


