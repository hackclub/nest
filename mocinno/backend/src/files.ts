import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Config } from './types';
import { isUndefinedOrEmpty } from './env';

export const ENV_BASTION_PROXY_KEY_PUB = isUndefinedOrEmpty(
	process.env.BASTION_PROXY_KEY_PUB,
	resolve(import.meta.dir, '../../bastion_proxy_key.pub')
);

export const ENV_BASTION_PROXY_KEY = isUndefinedOrEmpty(
	process.env.BASTION_PROXY_KEY,
	resolve(import.meta.dir, '../../bastion_proxy_key')
);

export const BASTION_PROXY_PUB_KEY = readFileSync(ENV_BASTION_PROXY_KEY_PUB, 'utf-8').trim();

export const BASTION_PROXY_PRIV_KEY = readFileSync(ENV_BASTION_PROXY_KEY, 'utf-8').trim();

export const ENV_BASTION_HOST_KEY = isUndefinedOrEmpty(
	process.env.BASTION_HOST_KEY,
	resolve(import.meta.dir, '../../bastion_host_key')
);

export const BASTION_HOST_PRIV_KEY = readFileSync(ENV_BASTION_HOST_KEY, 'utf-8').trim();

export const CONFIG = await (async () => {
	const CONFIG_FILE = isUndefinedOrEmpty(
		process.env.CONFIG_FILE,
		resolve(import.meta.dir, '../../config.ts')
	);
	return (await import(CONFIG_FILE)).default as Config;
})();
