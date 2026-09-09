enum ArchType {
	AMD64 = 'amd64',
	ARM64 = 'arm64',
	ARMHF = 'armhf',
	I386 = 'i386',
	RISCV32 = 'riscv32',
	RISCV64 = 'riscv64'
}

enum CMode {
	SHELL = 'shell',
	CONSOLE = 'console',
	TTY = 'tty'
}

enum Lock {
	BACKUP = 'backup',
	CREATE = 'create',
	DESTROYED = 'destroyed',
	DISK = 'disk',
	FSTRIM = 'fstrim',
	MIGRATE = 'migrate',
	MOUNTED = 'mounted',
	ROLLBACK = 'rollback',
	SNAPSHOT = 'snapshot',
	SNAPSHOT_DELETE = 'snapshot-delete'
}

enum OSType {
	DEBIAN = 'debian',
	DEVUAN = 'devuan',
	UBUNTU = 'ubuntu',
	CENTOS = 'centos',
	FEDORA = 'fedora',
	OPENSUSE = 'opensuse',
	ARCHLINUX = 'archlinux',
	ALPINE = 'alpine',
	GENTOO = 'gentoo',
	NIXOS = 'nixos',
	UNMANAGED = 'unmanaged'
}

interface FullNodeLXCConfig {
	arch: ArchType;
	cmode: CMode;
	console: boolean;
	cores: number;
	cpulimit: number;
	cpuunits: number;
	debug: boolean;
	description: string;
	//device list is not an array and it's string entries, handle manually lmao
	entrypoint: string;
	env: string;
	features: string;
	hookscript: string;
	hostname: string;
	lock: Lock;
	//lxc: Array<unknown>;
	memory: number;
	//mp is also not an array
	nameserver: string;
	onboot: boolean;
	ostype: OSType;
	protection: boolean;
	rootfs: string;
	searchdomain: string;
	startup: string;
	swap: number;
	tags: string;
	template: boolean;
	timezone: string;
	tty: number;
	unprivileged: boolean;
	//unused is also not an array
}

export type NodeLXCConfig = Partial<FullNodeLXCConfig>;

interface FullNodeLXCInterface {
	'hardware-address': string;
	hwaddr: string;
	'ip-addresses': Array<{
		'ip-address': string;
		'ip-address-type': string;
		prefix: number;
	}>;
	name: string;
	inet: string;
	inet6: string;
}

export type NodeLXCInterfaces = Array<Partial<FullNodeLXCInterface>>;

interface FullNodeLXCStatusCurrent {
	cpu: number;
	cpus: number;
	disk: number;
	diskread: number;
	diskwrite: number;
	lock: string;
	maxdisk: number;
	maxmem: number;
	maxswap: number;
	mem: number;
	name: string;
	netin: number;
	netout: number;
	pressurecpusome: number;
	pressureiofull: number;
	pressureiosome: number;
	pressurememoryfull: number;
	pressurememorysome: number;
	tags: string;
	template: boolean;
	uptime: number;
	status: 'stopped' | 'running';
}

export type NodeLXCStatusCurrent = Partial<FullNodeLXCStatusCurrent>;

interface FullNodeLXCPending {
	key: string;
	delete: number;
	pending: string;
	value: string;
}

export type NodeLXCPending = Array<Partial<FullNodeLXCPending>>;

interface FullNodeTaskStatus {
	id: string;
	node: string;
	pid: number;
	pstart: number;
	starttime: number;
	status: 'running' | 'stopped'; // not making a dedicated enum for this
	type: string;
	upid: string;
	user: string;
	exitstatus: string;
}

export type NodeTaskStatus = Partial<FullNodeTaskStatus>;

// All types in node status are obligatory, there's other types that are all obligatory but i just blanket gave them all Partial because lazy
export interface NodeStatus {
	'boot-info': {
		mode: 'efi' | 'legacy-bios';
		secureboot: boolean;
	};
	cpu: number;
	cpuinfo: {
		cores: number;
		cpus: number;
		model: string;
		sockets: number;
	};
	'current-kernel': {
		machine: string;
		release: string;
		sysname: string;
		version: string;
	};
	loadavg: [string, string, string];
	memory: {
		available: number;
		free: number;
		total: number;
		used: number;
	};
	pveversion: string;
	rootfs: {
		avail: number;
		free: number;
		total: number;
		used: number;
	};
	uptime: number; // Proxmox API Docs don't have any uptime property but it works so it apparently exists?
}

interface FullNodeLXC {
	status: 'stopped' | 'running';
	vmid: number;
	cpu: number;
	cpus: number;
	disk: number;
	diskread: number;
	diskwrite: number;
	lock: string;
	maxdisk: number;
	maxmem: number;
	maxswap: number;
	mem: number;
	name: string;
	netin: number;
	netout: number;
	pressurecpusome: number;
	pressureiofull: number;
	pressureiosome: number;
	pressurememoryfull: number;
	pressurememorysome: number;
	tags: string;
	template: boolean;
	uptime: number;
}

export type NodeLXC = Array<Partial<FullNodeLXC>>;

export interface NodeStorageStatus {
	content: string;
	type: string;
	active: boolean;
	avail: number;
	enabled: boolean;
	shared: boolean;
	total: number;
	used: number;
}

export type NodeLXCStatusStart = string;
export type NodeLXCStatusStop = string;
export type NodeLXCStatusReboot = string;
export type NodeLXCDelete = string;
export type NodeLXCPost = string;

// types are not 1:1 but i'm lazy rn
export type NodeLXCIndex = Array<
	Partial<FullNodeLXCConfig> & {
		vmid: number;
		status: 'stopped' | 'running';
		name: string;
		cpu: number;
		cpus: number;
	}
>;

export type Backup = {
	format: string;
	size: number;
	volid: string;
	ctime?: number;
	encrypted?: boolean;
	notes?: string;
	parent?: string;
	protected?: boolean;
	content: string;
	used?: number;
	verification?: {
		state: string;
		upid: string;
	};
	vmid?: number;
};

export type BackupAttrs = {
	format: string;
	path: string;
	size: number;
	used: number;
	notes: string;
	protected: boolean;
};
