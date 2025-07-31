import { NextApiRequest, NextApiResponse } from 'next';
import { execSync } from 'child_process';
import fs from 'fs';
import os from 'os';

interface SystemInfo {
  hostname: string;
  os: string;
  host: string;
  kernel: string;
  uptime: string;
  packages: string;
  shell: string;
  resolution: string;
  terminal: string;
  cpu: string;
  gpu: string;
  memory: string;
}

function formatUptime(uptimeSeconds: number): string {
  const days = Math.floor(uptimeSeconds / 86400);
  const hours = Math.floor((uptimeSeconds % 86400) / 3600);
  const minutes = Math.floor((uptimeSeconds % 3600) / 60);
  
  if (days > 0) {
    return `${days} days, ${hours} hours, ${minutes} min`;
  } else if (hours > 0) {
    return `${hours} hours, ${minutes} min`;
  } else {
    return `${minutes} min`;
  }
}

function getMemoryInfo(): string {
  try {
    const meminfo = fs.readFileSync('/proc/meminfo', 'utf8');
    const memTotal = parseInt(meminfo.match(/MemTotal:\s+(\d+)/)?.[1] || '0') * 1024;
    const memAvailable = parseInt(meminfo.match(/MemAvailable:\s+(\d+)/)?.[1] || '0') * 1024;
    const memUsed = memTotal - memAvailable;
    
    const usedMiB = Math.round(memUsed / (1024 * 1024));
    const totalMiB = Math.round(memTotal / (1024 * 1024));
    
    return `${usedMiB}MiB / ${totalMiB}MiB`;
  } catch {
    return 'N/A';
  }
}

function getCPUInfo(): string {
  try {
    const cpuinfo = fs.readFileSync('/proc/cpuinfo', 'utf8');
    const modelMatch = cpuinfo.match(/model name\s*:\s*(.+)/);
    const cpuCount = (cpuinfo.match(/processor\s*:/g) || []).length;
    
    if (modelMatch) {
      return `${modelMatch[1]} (${cpuCount}) @ 2.749GHz`;
    }
    return `Unknown CPU (${cpuCount} cores)`;
  } catch {
    return 'N/A';
  }
}

function getPackageCount(): string {
  try {
    const dpkgCount = execSync('dpkg -l | grep "^ii" | wc -l', { encoding: 'utf8' }).trim();
    
    let nixUserCount = '0';
    let nixDefaultCount = '0';
    
    try {
      nixUserCount = execSync('nix-env -q | wc -l', { encoding: 'utf8' }).trim();
    } catch {}
    
    try {
      nixDefaultCount = execSync('nix-env -p /nix/var/nix/profiles/default -q | wc -l', { encoding: 'utf8' }).trim();
    } catch {}
    
    return `${dpkgCount} (dpkg), ${nixUserCount} (nix-user), ${nixDefaultCount} (nix-default)`;
  } catch {
    return 'N/A';
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<SystemInfo>) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' } as any);
  }

  try {
    const systemInfo: SystemInfo = {
      hostname: 'orpheus@nest',
      os: 'Debian GNU/Linux 13 (trixie) x86_64',
      host: 'KVM/QEMU (Standard PC (i440FX + PIIX, 1996) pc-i440fx-9.2)',
      kernel: execSync('uname -r', { encoding: 'utf8' }).trim(),
      uptime: formatUptime(os.uptime()),
      packages: getPackageCount(),
      shell: 'bash 5.2.37',
      resolution: '1280x800',
      terminal: '/dev/pts/0',
      cpu: getCPUInfo(),
      gpu: '00:02.0 Vendor 1234 Device 1111',
      memory: getMemoryInfo(),
    };

    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');
    res.status(200).json(systemInfo);
  } catch (error) {
    console.error('Error fetching system info:', error);
    res.status(500).json({ error: 'Failed to fetch system info. Nest admins should have logs.' } as any);
  }
}
