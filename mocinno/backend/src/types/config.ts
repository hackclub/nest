interface ServerConfig {
	name: string;
	node: string;
	location: string;
	maxServers: number;
	hostIP: string;
	ipv4: {
		cidr: string;
		gateway: string;
	};
	ipv6: {
		prefix: string;
		cidr: number;
		gateway: string;
	};
	rootfs: string;
	templates: {
		name: string;
		template: string;
	}[];
}

interface SpecialHost {
	authorized_keys: string[];
	target: string;
	username: string;
}

export interface Config {
	servers: ServerConfig[];
	specialHosts: Record<string, SpecialHost>;
}
