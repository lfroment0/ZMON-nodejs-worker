import { execZmonScript } from './exec';

function mockHttp() {
    return {response: true};
}

describe('Worker', () => {
    const entity: any = {type: 'kube_pod'};
    const check: string = `
        function check() {
            return plugin("http://cool.website.com")
        }
    `;

    it('should return the value from an entity\'s field', () => {
        const entity = {
            type: 'kube_pod',
            infrastructure_account: 'aws:438748764'
        };
        const check: string = `
            function check() {
                return entity.type;
            }
        `;
        const ctx = {};

        const { result } = execZmonScript(ctx, check, {entity});
        expect(result).toEqual('kube_pod');
    });

    it('should fail executing the check because it is trying to access fields from an undefined object', () => {
        const check: string = `
            function check() {
                return undefinedObj.type;
            }
        `;
        let res;
        let err;

        try {
            res = execZmonScript({}, check, {entity});
        } catch (e) {
            err = e;
        }
        expect(err.name).toEqual('ReferenceError');
        expect(res).toBeUndefined();
    });

    it('should return an object that is a subset of an entity', () => {
        const entity = {
            type: 'kube_pod',
            infrastructure_account: 'aws:438748764',
            team: 'myTeam'
        };
        const check: string = `
            function check() {
                return {
                    type: entity.type, 
                    team: entity.team
                    };
            }
        `;
        const ctx = {};

        const { result } = execZmonScript(ctx, check, {entity});
        expect(result).toEqual({type: entity.type, team: entity.team});
    });

    it('should make an http call', () => {
        const ctx = {plugin: mockHttp}
        const { result } = execZmonScript(ctx, check, {entity});
        expect(result).toEqual({response: true});
    });

    it('should fail executing the check because eval should not be used', () => {
        const check: string = `
            function check() {
                return eval("{hello: 'world'}");
            }
        `;
        const ctx = {}
        let res;
        let err;

        try {
            res = execZmonScript(ctx, check, {entity});
        } catch (e) {
            err = e;
        }
        expect(err.name).toEqual('EvalError');
        expect(res).toBeUndefined();
    });


    it('should fail making an http request', () => {
        const ctx = {};
        let res;
        try {
            const { result } = execZmonScript(ctx, check, {entity});
            res = result;
        } catch (e) {}

        expect(res).toBeUndefined();
    });
});
