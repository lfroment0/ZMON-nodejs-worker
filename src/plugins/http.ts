import fetch, { Response } from 'node-fetch';

export async function http(url: string, Oauth?: boolean): Promise<any> {
    if (!url) {
        console.error(`${url} is no valid url`)
    }
    const res = await fetch(url).catch(err => err);
    return res;
}
