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

function getOSInfo(): string {
  try {
    // read /etc/os-release 
    if (fs.existsSync('/etc/os-release')) {
      const osRelease = fs.readFileSync('/etc/os-release', 'utf8');
      const prettyNameMatch = osRelease.match(/PRETTY_NAME="(.+)"/);
      if (prettyNameMatch) {
        const arch = execSync('uname -m', { encoding: 'utf8' }).trim();
        return `${prettyNameMatch[1]} ${arch}`;
      }
    }
    return 'Debian GNU/Linux 13 (trixie) x86_64'; // fallback
  } catch {
    return 'Debian GNU/Linux 13 (trixie) x86_64';
  }
}

function getHostInfo(): string {
  try {
    const vendor = fs.readFileSync('/sys/class/dmi/id/sys_vendor', 'utf8').trim();
    const product = fs.readFileSync('/sys/class/dmi/id/product_name', 'utf8').trim();
    const version = fs.readFileSync('/sys/class/dmi/id/product_version', 'utf8').trim();
    
    if (vendor.toLowerCase().includes('qemu') || product.toLowerCase().includes('qemu')) {
      return `KVM/QEMU (${product} ${version})`;
    }
    return `${vendor} ${product} ${version}`;
  } catch {
    return 'KVM/QEMU (Standard PC (i440FX + PIIX, 1996) pc-i440fx-8.1)'; // fallback
  }
}

function getKernel(): string {
  try {
    return execSync('uname -r', { encoding: 'utf8' }).trim();
  } catch {
    return '6.12.38+deb13-amd64'; //fallback - 31/07/2025
  }
 }

function getPackageCount(): string {
  try {
    const dpkgCount = execSync('dpkg -l 2>/dev/null | grep "^ii" | wc -l', { encoding: 'utf8' }).trim();
    
    let nixUserCount = '0';
    let nixDefaultCount = '0';
    
    try {
      nixUserCount = execSync('nix-env -q 2>/dev/null | wc -l', { encoding: 'utf8' }).trim();
    } catch {}
    
    try {
      nixDefaultCount = execSync('nix-env -p /nix/var/nix/profiles/default -q 2>/dev/null | wc -l', { encoding: 'utf8' }).trim();
    } catch {}
    
    return `${dpkgCount} (dpkg), ${nixUserCount} (nix-user), ${nixDefaultCount} (nix-default)`;
  } catch {
    return '4366 (dpkg), 47 (nix-default)'; //fallback - 31/07/20205
  }
}

function getShell(): string {
  try {
    const bashVersion = execSync('bash --version | head -n1', { encoding: 'utf8' });
    const versionMatch = bashVersion.match(/version (\d+\.\d+\.\d+)/);
    if (versionMatch) {
      return `bash ${versionMatch[1]}`;
    }
    return 'bash 5.2.37'; //fallback - 31/07/20205
  } catch {
    return 'bash 5.2.37';
  }
}

function getTerminal(): string {
  try {
    // Get the current TTY. prolly wont work
    const tty = execSync('tty 2>/dev/null', { encoding: 'utf8' }).trim();
    if (tty && tty !== 'not a tty') {
      return tty;
    }
    return '/dev/pts/88';
  } catch {
    return '/dev/pts/88';
  }
}

function getCPUInfo(): string {
  try {
    const cpuinfo = fs.readFileSync('/proc/cpuinfo', 'utf8');
    const modelMatch = cpuinfo.match(/model name\s*:\s*(.+)/);
    const cpuCount = (cpuinfo.match(/processor\s*:/g) || []).length;
    const cpuFreq = cpuinfo.match(/cpu MHz\s*:\s*([0-9.]+)/);
    if (modelMatch) {
      if (cpuFreq) {
        const freqGHz = (parseFloat(cpuFreq[1]) / 1000).toFixed(3);
        return `${modelMatch[1]} (${cpuCount}) @ ${freqGHz}GHz`;
      }
      return `${modelMatch[1]} (${cpuCount})`;
    }
    return 'AMD EPYC 9454P (80) @ 2.749GHz';
  } catch {
    return 'AMD EPYC 9454P (80) @ 2.749GHz';
  }
}

function getGPUInfo(): string {
  try {
    const lspciOutput = execSync('lspci 2>/dev/null | grep -i "vga\\|3d\\|display"', { encoding: 'utf8' });
    if (lspciOutput.trim()) {
      const line = lspciOutput.trim().split('\n')[0];
      const match = line.match(/^([0-9a-f:\.]+)\s+.*?:\s*(.+)$/i);
      if (match) {
        return `${match[1]} ${match[2]}`;
      }
    }
  } catch {}
  
  return '00:02.0 Vendor 1234 Device 1111'; //  fallback
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
    return '77808MiB / 150865MiB';
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<SystemInfo>) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' } as any);
  }

  try {
    const systemInfo: SystemInfo = {
      hostname: 'orpheus@nest', // Static. orpheus cos why not
      os: getOSInfo(),
      host: getHostInfo(),
      kernel: getKernel(),
      uptime: formatUptime(os.uptime()),
      packages: getPackageCount(),
      shell: getShell(),
      resolution: '1280x800', // Static. idk how to find this
      terminal: getTerminal(),
      cpu: getCPUInfo(),
      gpu: getGPUInfo(),
      memory: getMemoryInfo(),
     };

    // Cache for 30 seconds
    res.setHeader('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=60');
    res.status(200).json(systemInfo);
  } catch (error) {
    console.error('Error fetching system info:', error);
    res.status(500).json({ error: 'Failed to fetch system info. Nest admins should have logs.' } as any);
  }
}
