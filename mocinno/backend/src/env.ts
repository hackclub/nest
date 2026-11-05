export const isUndefinedOrEmpty = <T>(
	value: string | undefined,
	replace_value: T | undefined
): string | T => {
	if (value === undefined || value.trim() === '') {
		return replace_value as T;
	}
	return value as T;
};

export const NODE_ENV = isUndefinedOrEmpty(process.env.NODE_ENV, 'development');

export const MOCINNO_PORT = Number(isUndefinedOrEmpty<number>(process.env.MOCINNO_PORT, 3001));

export const MOCINNO_MAX_BODY_REQUEST_SIZE = Number(
	isUndefinedOrEmpty<number>(process.env.MOCINNO_MAX_BODY_REQUEST_SIZE, 1024 * 1024 * 128)
);

export const MOCINNO_HOSTNAME = isUndefinedOrEmpty(process.env.MOCINNO_HOSTNAME, 'localhost');

export const ENCRYPTION_KEY = (() => {
	if (!isUndefinedOrEmpty(process.env.ENCRYPTION_KEY, undefined)) {
		throw new Error('ENCRYPTION_KEY environment variable is required');
	}
	return process.env.ENCRYPTION_KEY as string;
})();

export const DISABLE_SSL =
	isUndefinedOrEmpty(process.env.DISABLE_SSL, 'false').toLowerCase() === 'true';

export const APP_SECURE =
	isUndefinedOrEmpty(process.env.APP_SECURE, 'false').toLowerCase() === 'true';

export const APP_DOMAIN = isUndefinedOrEmpty(process.env.APP_DOMAIN, undefined);

export const SMTP_HOST = isUndefinedOrEmpty(process.env.SMTP_HOST, 'localhost');
export const SMTP_PORT = Number(isUndefinedOrEmpty(process.env.SMTP_PORT, 587));
export const SMTP_USER = isUndefinedOrEmpty(process.env.SMTP_USER, undefined);
export const SMTP_FROM = isUndefinedOrEmpty(process.env.SMTP_FROM, undefined);
export const SMTP_PASSWORD = isUndefinedOrEmpty(process.env.SMTP_PASSWORD, undefined);

export const ROOTFS = isUndefinedOrEmpty(process.env.ROOTFS, 'local-zfs:8');

export const AIRBRIDGE_URL = isUndefinedOrEmpty(
	process.env.AIRBRIDGE_URL,
	'https://airbridge.hackclub.com/v0.2'
);

export const AIRBRIDGE_KEY = isUndefinedOrEmpty<string | undefined>(
	process.env.AIRBRIDGE_KEY,
	undefined
);

export const OAUTH_CLIENT_ID = (() => {
	if (!isUndefinedOrEmpty(process.env.OAUTH_CLIENT_ID, undefined)) {
		throw new Error('OAUTH_CLIENT_ID environment variable is required');
	}

	return process.env.OAUTH_CLIENT_ID as string;
})();

export const OAUTH_CLIENT_SECRET = (() => {
	if (!isUndefinedOrEmpty(process.env.OAUTH_CLIENT_SECRET, undefined)) {
		throw new Error('OAUTH_CLIENT_SECRET environment variable is required');
	}

	return process.env.OAUTH_CLIENT_SECRET as string;
})();

export const OS_TEMPLATE = isUndefinedOrEmpty(
	process.env.OS_TEMPLATE,
	'local:vztmpl/debian-13-standard_13.1-2_amd64.tar.zst'
);

export const ADMIN_EMAILS = isUndefinedOrEmpty(process.env.ADMIN_EMAILS, '');

export const VIEWER_EMAILS = isUndefinedOrEmpty(process.env.VIEWER_EMAILS, '');

export const SLACK_WEBHOOK_URL = isUndefinedOrEmpty(process.env.SLACK_WEBHOOK_URL, undefined);

export const ZEROSSL_EAB_KID = (() => {
	if (
		!isUndefinedOrEmpty(process.env.ZEROSSL_EAB_KID, undefined) &&
		NODE_ENV === 'production' &&
		!DISABLE_SSL
	) {
		throw new Error('ZEROSSL_EAB_KID environment variable is required');
	}
	return process.env.ZEROSSL_EAB_KID as string;
})();

export const ZEROSSL_EAB_HMAC_KEY = (() => {
	if (
		!isUndefinedOrEmpty(process.env.ZEROSSL_EAB_HMAC_KEY, undefined) &&
		NODE_ENV === 'production' &&
		!DISABLE_SSL
	) {
		throw new Error('ZEROSSL_EAB_HMAC_KEY environment variable is required');
	}
	return process.env.ZEROSSL_EAB_HMAC_KEY as string;
})();

export const STALWART_DOMAIN = isUndefinedOrEmpty(process.env.STALWART_DOMAIN, undefined);

export const STALWART_API_KEY = isUndefinedOrEmpty(process.env.STALWART_API_KEY, undefined);

export const STALWART_MAIL_DOMAIN = isUndefinedOrEmpty(process.env.STALWART_MAIL_DOMAIN, undefined);
