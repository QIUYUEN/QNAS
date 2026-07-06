const fs = require('fs-extra');
const { execFile } = require('child_process');

function getSystemDrive() {
  return (process.env.SystemDrive || 'C:').toUpperCase();
}

async function pathExistsSafe(p) {
  try { await fs.access(p); return true; } catch { return false; }
}

function toNumber(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function buildDriveInfo(drive) {
  const name = String(drive.Name || drive.DeviceID || '').toUpperCase();
  if (!/^[A-Z]:$/.test(name)) return null;
  const volumeName = String(drive.VolumeName || '').trim();
  const size = toNumber(drive.Size);
  const free = toNumber(drive.FreeSpace);
  const driveType = String(drive.DriveType || '3');
  const displayName = volumeName ? `${volumeName} (${name})` : `本地磁盘 (${name})`;
  return {
    id: name,
    name: displayName,
    driveLetter: name,
    volumeName,
    path: name + '\\',
    type: driveType === '4' ? 'network' : (driveType === '2' ? 'removable' : 'drive'),
    size,
    free,
    used: size != null && free != null ? Math.max(0, size - free) : null
  };
}

async function scanByLetters(config) {
  const roots = [];
  const systemDrive = getSystemDrive();
  for (let code = 65; code <= 90; code++) {
    const letter = String.fromCharCode(code) + ':';
    const rootPath = letter + '\\';
    if (config.fileAccess.hideSystemDrive && letter.toUpperCase() === systemDrive) continue;
    if (await pathExistsSafe(rootPath)) {
      roots.push({
        id: letter,
        name: `本地磁盘 (${letter})`,
        driveLetter: letter,
        volumeName: '',
        path: rootPath,
        type: 'drive',
        size: null,
        free: null,
        used: null
      });
    }
  }
  return roots;
}

async function scanByPowerShell(config) {
  return new Promise((resolve) => {
    const ps = [
      '-NoProfile',
      '-ExecutionPolicy', 'Bypass',
      '-Command',
      "Get-CimInstance Win32_LogicalDisk | Where-Object {$_.DriveType -in 2,3,4} | Select-Object DeviceID,VolumeName,DriveType,Size,FreeSpace | ConvertTo-Json -Compress"
    ];
    execFile('powershell.exe', ps, { windowsHide: true, timeout: 10000 }, async (err, stdout) => {
      if (err || !stdout) return resolve(await scanByLetters(config));
      try {
        const parsed = JSON.parse(stdout.trim());
        const list = Array.isArray(parsed) ? parsed : [parsed];
        const systemDrive = getSystemDrive();
        const roots = [];
        for (const d of list) {
          const info = buildDriveInfo(d);
          if (!info) continue;
          if (config.fileAccess.hideSystemDrive && info.driveLetter.toUpperCase() === systemDrive) continue;
          roots.push(info);
        }
        roots.sort((a, b) => a.driveLetter.localeCompare(b.driveLetter));
        resolve(roots.length ? roots : await scanByLetters(config));
      } catch {
        resolve(await scanByLetters(config));
      }
    });
  });
}

async function getRoots(config) {
  if (Array.isArray(config.fileAccess.customRoots) && config.fileAccess.customRoots.length) {
    return config.fileAccess.customRoots.map((r, i) => ({ id: 'custom-' + i, name: r.name || r.path, path: r.path, type: 'custom', size: null, free: null, used: null }));
  }
  if (config.fileAccess.allowWholeNonSystemDrives) return scanByPowerShell(config);
  return [];
}

module.exports = { getRoots, getSystemDrive };
