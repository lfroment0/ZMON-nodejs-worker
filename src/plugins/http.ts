import fetch from 'node-fetch';

export async function http(url: string, Oauth?: boolean) {
    return await fetch(url).then((res: any) => res.json());
}
