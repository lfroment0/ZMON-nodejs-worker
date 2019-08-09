import fetch from 'node-fetch';

const rp = require('request-promise');
import { get } from 'http';

export async function http(url: string, Oauth?: boolean) {
    return await fetch(url).then((res: any) => res.json())
}
