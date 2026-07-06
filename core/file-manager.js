const fs = require('fs-extra');
const path = require('path');
const archiver = require('archiver');
const { execFile } = require('child_process');
const { getRoots } = require('./drive-scanner');
const userManager = require('./user-manager');

function normalizeWin(p) {
  if (!p || typeof p !== 'string') throw new Error('路径不能为空');
  return path.win32.resolve(p);
}


function isAdmin(user) {
  return user && user.role === 'admin';
}

function getFullUser(config, user) {
  if (!user || !user.id) return null;
  return userManager.findById(config, user.id) || user;
}

function normalizePermissionPath(p) {
  const raw = String(p || '').trim();
  if (!raw) return '';
  if (raw === '*') return '*';
  return normalizeWin(raw);
}

async function systemRoots(config) {
  const roots = await getRoots(config);
  return roots.map(r => ({ ...r, real: normalizeWin(r.path) }));
}

async function visibleRoots(config, user) {
  const roots = await systemRoots(config);
  const full = getFullUser(config, user);
  if (!full || isAdmin(full)) return roots;
  const perms = userManager.normalizePermissions(full.permissions);
  const paths = perms.allowedPaths.map(normalizePermissionPath).filter(Boolean);
  if (paths.includes('*')) return roots;

  const result = [];
  const seen = new Set();
  for (const permPath of paths) {
    const hostRoot = roots.find(root => permPath === root.real || permPath.startsWith(root.real.endsWith('\\') ? root.real : root.real + '\\'));
    if (!hostRoot) continue;
    const key = permPath.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    if (permPath === hostRoot.real) {
      result.push(hostRoot);
    } else {
      result.push({
        id: 'path-' + result.length,
        name: path.win32.basename(permPath) || permPath,
        driveLetter: hostRoot.driveLetter,
        volumeName: '',
        path: permPath,
        type: 'custom',
        size: null,
        free: null,
        used: null,
        real: permPath
      });
    }
  }
  return result;
}

async function allowedRoots(config, user) {
  return visibleRoots(config, user);
}

async function assertAllowed(config, targetPath, user) {
  const realTarget = normalizeWin(targetPath);
  const roots = await visibleRoots(config, user);
  const ok = roots.some(root => realTarget === root.real || realTarget.startsWith(root.real.endsWith('\\') ? root.real : root.real + '\\'));
  if (!ok) throw new Error('没有权限访问该路径');
  const appRoot = path.win32.resolve(path.join(__dirname, '..'));
  if (realTarget === appRoot || realTarget.startsWith(appRoot + '\\')) throw new Error('禁止操作程序自身目录');
  return realTarget;
}

function ensureActionAllowed(config, user, action) {
  const full = getFullUser(config, user);
  if (!full || isAdmin(full)) return true;
  const perms = userManager.normalizePermissions(full.permissions);
  if (!perms.actions[action]) throw new Error('当前用户没有执行此操作的权限');
  return true;
}


function safeBaseName(name) {
  return String(name || '').replace(/[\\/:*?"<>|]/g, '_').slice(0, 180) || 'unnamed';
}

function isImageFile(name) {
  return /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(String(name || ''));
}

function isVideoFile(name) {
  return /\.(mp4|webm|mov|m4v)$/i.test(String(name || ''));
}

async function hasHiddenOrSystemAttr(p) {
  if (process.platform !== 'win32') return false;
  return new Promise((resolve) => {
    execFile('attrib', [p], { windowsHide: true }, (err, stdout) => {
      if (err || !stdout) return resolve(false);
      const line = stdout.split(/\r?\n/).find(Boolean) || '';
      resolve(/[HS]/i.test(line.slice(0, 12)));
    });
  });
}

async function shouldHideEntry(config, fullPath, name) {
  if (!config.fileAccess || config.fileAccess.hideHiddenFiles === false) return false;
  const lower = String(name || '').toLowerCase();
  if (name.startsWith('.') || ['desktop.ini', 'thumbs.db', '$recycle.bin', 'system volume information'].includes(lower)) return true;
  return hasHiddenOrSystemAttr(fullPath);
}

async function listDir(config, dirPath, user) {
  const real = await assertAllowed(config, dirPath, user);
  const entries = await fs.readdir(real, { withFileTypes: true });
  const items = [];
  for (const ent of entries) {
    if (ent.name === '.nas-lite-trash') continue;
    const p = path.win32.join(real, ent.name);
    if (await shouldHideEntry(config, p, ent.name)) continue;
    try {
      const stat = await fs.stat(p);
      items.push({
        name: ent.name,
        path: p,
        isDirectory: ent.isDirectory(),
        size: ent.isDirectory() ? null : stat.size,
        modifiedAt: stat.mtime,
        type: ent.isDirectory() ? 'folder' : (isImageFile(ent.name) ? 'image' : (isVideoFile(ent.name) ? 'video' : 'file')),
        thumbnail: !ent.isDirectory() && isImageFile(ent.name)
      });
    } catch {}
  }
  items.sort((a, b) => Number(b.isDirectory) - Number(a.isDirectory) || a.name.localeCompare(b.name, 'zh-Hans-CN'));
  return { path: real, items };
}

async function mkdir(config, dirPath, name, user) {
  ensureActionAllowed(config, user, 'mkdir');
  const parent = await assertAllowed(config, dirPath, user);
  const target = path.win32.join(parent, safeBaseName(name));
  await assertAllowed(config, target, user);
  await fs.ensureDir(target);
  return { path: target };
}

async function remove(config, targetPath, user) {
  ensureActionAllowed(config, user, 'delete');
  const real = await assertAllowed(config, targetPath, user);
  if (config.fileAccess.trashInsteadOfDelete) {
    const root = (await allowedRoots(config, user)).find(r => real === r.real || real.startsWith(r.real.endsWith('\\') ? r.real : r.real + '\\'));
    const trash = path.win32.join(root.real, '.nas-lite-trash');
    await fs.ensureDir(trash);
    const dest = path.win32.join(trash, Date.now() + '_' + path.win32.basename(real));
    await fs.move(real, dest, { overwrite: false });
    return { trashed: true, path: dest };
  }
  await fs.remove(real);
  return { deleted: true };
}

async function rename(config, targetPath, newName, user) {
  ensureActionAllowed(config, user, 'rename');
  const real = await assertAllowed(config, targetPath, user);
  const dest = path.win32.join(path.win32.dirname(real), safeBaseName(newName));
  await assertAllowed(config, dest, user);
  await fs.move(real, dest, { overwrite: false });
  return { path: dest };
}

async function copy(config, sources, destDir, user) {
  ensureActionAllowed(config, user, 'copy');
  const dest = await assertAllowed(config, destDir, user);
  const results = [];
  for (const src of sources) {
    const realSrc = await assertAllowed(config, src, user);
    let target = path.win32.join(dest, path.win32.basename(realSrc));
    if (await fs.pathExists(target)) {
      const parsed = path.win32.parse(target);
      target = path.win32.join(parsed.dir, `${parsed.name}_copy_${Date.now()}${parsed.ext}`);
    }
    await fs.copy(realSrc, target, { errorOnExist: false, overwrite: false });
    results.push({ from: realSrc, to: target });
  }
  return { results };
}

async function move(config, sources, destDir, user) {
  ensureActionAllowed(config, user, 'move');
  const dest = await assertAllowed(config, destDir, user);
  const results = [];
  for (const src of sources) {
    const realSrc = await assertAllowed(config, src, user);
    let target = path.win32.join(dest, path.win32.basename(realSrc));
    if (await fs.pathExists(target)) throw new Error('目标已存在：' + target);
    await fs.move(realSrc, target, { overwrite: false });
    results.push({ from: realSrc, to: target });
  }
  return { results };
}

async function zipFolder(config, targetPath, res, user) {
  ensureActionAllowed(config, user, 'download');
  const real = await assertAllowed(config, targetPath, user);
  const stat = await fs.stat(real);
  if (!stat.isDirectory()) throw new Error('不是文件夹');
  const fileName = encodeURIComponent(path.win32.basename(real) + '.zip');
  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${fileName}`);
  const archive = archiver('zip', { zlib: { level: 6 } });
  archive.on('error', err => { throw err; });
  archive.pipe(res);
  archive.directory(real, false);
  await archive.finalize();
}

async function collectStats(config, targetPath, user) {
  const real = await assertAllowed(config, targetPath, user);
  const stat = await fs.stat(real);
  const base = {
    name: path.win32.basename(real) || real,
    path: real,
    isDirectory: stat.isDirectory(),
    size: stat.isDirectory() ? 0 : stat.size,
    createdAt: stat.birthtime,
    modifiedAt: stat.mtime,
    accessedAt: stat.atime,
    fileCount: stat.isDirectory() ? 0 : 1,
    folderCount: 0,
    truncated: false
  };
  if (!stat.isDirectory()) return base;

  const maxEntries = 200000;
  async function walk(dir) {
    if (base.fileCount + base.folderCount >= maxEntries) { base.truncated = true; return; }
    let entries = [];
    try { entries = await fs.readdir(dir, { withFileTypes: true }); } catch { return; }
    for (const ent of entries) {
      if (base.fileCount + base.folderCount >= maxEntries) { base.truncated = true; return; }
      if (ent.name === '.nas-lite-trash') continue;
      const full = path.win32.join(dir, ent.name);
      if (await shouldHideEntry(config, full, ent.name)) continue;
      try {
        const st = await fs.stat(full);
        if (st.isDirectory()) {
          base.folderCount += 1;
          await walk(full);
        } else {
          base.fileCount += 1;
          base.size += st.size;
        }
      } catch {}
    }
  }
  await walk(real);
  return base;
}

async function zipSelected(config, sources, destDir, user) {
  ensureActionAllowed(config, user, 'zip');
  if (!Array.isArray(sources) || !sources.length) throw new Error('请选择要压缩的项目');
  const dest = await assertAllowed(config, destDir, user);
  const stamp = new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14);
  let zipPath = path.win32.join(dest, `archive_${stamp}.zip`);
  let i = 1;
  while (await fs.pathExists(zipPath)) {
    zipPath = path.win32.join(dest, `archive_${stamp}_${i++}.zip`);
  }
  await new Promise(async (resolve, reject) => {
    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 6 } });
    output.on('close', resolve);
    output.on('error', reject);
    archive.on('error', reject);
    archive.pipe(output);
    for (const src of sources) {
      const realSrc = await assertAllowed(config, src, user);
      const st = await fs.stat(realSrc);
      const name = path.win32.basename(realSrc);
      if (st.isDirectory()) archive.directory(realSrc, name);
      else archive.file(realSrc, { name });
    }
    archive.finalize();
  });
  return { path: zipPath, name: path.win32.basename(zipPath) };
}

module.exports = { allowedRoots, visibleRoots, assertAllowed, ensureActionAllowed, listDir, mkdir, remove, rename, copy, move, zipFolder, zipSelected, collectStats, isImageFile };
