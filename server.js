const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const os = require('os');
const net = require('net');

const { loadConfig } = require('./core/config');
const { verifyLogin, signToken, authMiddleware, requireAdmin } = require('./core/auth');
const { getRoots } = require('./core/drive-scanner');
const fileManager = require('./core/file-manager');
const userManager = require('./core/user-manager');
const tunnel = require('./core/tunnel-manager');

function getLanIPs() {
  const nets = os.networkInterfaces();
  const ips = [];
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      if (net.family === 'IPv4' && !net.internal) ips.push(net.address);
    }
  }
  return ips;
}


function isPortAvailable(port, host) {
  return new Promise((resolve) => {
    const srv = net.createServer();
    srv.once('error', () => resolve(false));
    srv.once('listening', () => srv.close(() => resolve(true)));
    srv.listen(port, host || '0.0.0.0');
  });
}

async function resolveServerPort(config) {
  const requested = Number(config.server.port || 8088);
  const autoPort = config.server.autoPort !== false;
  const host = config.server.host || '0.0.0.0';
  if (!autoPort) return requested;
  const maxPort = Number(config.server.portRangeEnd || requested + 100);
  for (let port = requested; port <= maxPort; port++) {
    if (await isPortAvailable(port, host)) return port;
  }
  throw new Error(`没有可用端口：${requested}-${maxPort}`);
}

function avatarExt(filename, mimetype) {
  const ext = path.extname(filename || '').toLowerCase();
  if (['.png', '.jpg', '.jpeg', '.webp', '.gif'].includes(ext)) return ext;
  if (mimetype === 'image/png') return '.png';
  if (mimetype === 'image/jpeg') return '.jpg';
  if (mimetype === 'image/webp') return '.webp';
  if (mimetype === 'image/gif') return '.gif';
  return '';
}

(async () => {
  const config = await loadConfig();
  const app = express();
  const tempDir = path.join(__dirname, 'uploads_temp');
  const avatarDir = path.join(__dirname, 'data', 'avatars');
  await fs.ensureDir(tempDir);
  await fs.ensureDir(avatarDir);

  const upload = multer({
    dest: tempDir,
    limits: { fileSize: (config.fileAccess.maxUploadMB || 2048) * 1024 * 1024 }
  });
  const avatarUpload = multer({
    dest: tempDir,
    limits: { fileSize: 3 * 1024 * 1024 }
  });

  app.use(cors());
  app.use(express.json({ limit: '10mb' }));
  app.use('/avatars', express.static(avatarDir, { fallthrough: false, maxAge: '1d' }));
  app.use(express.static(path.join(__dirname, 'public')));

  app.post('/api/login', async (req, res) => {
    try {
      const user = await verifyLogin(config, req.body.username, req.body.password);
      if (!user) return res.status(401).json({ error: '用户名或密码错误' });
      res.json({ token: signToken(config, user), user });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  const auth = authMiddleware(config);

  app.get('/api/me', auth, async (req, res) => {
    res.json({ user: req.user });
  });

  app.post('/api/change-password', auth, async (req, res) => {
    try {
      res.json(await userManager.changeOwnPassword(config, req.user.id, req.body.oldPassword, req.body.newPassword));
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/me/avatar', auth, avatarUpload.single('avatar'), async (req, res) => {
    try {
      if (!req.file) throw new Error('请选择头像文件');
      const ext = avatarExt(req.file.originalname, req.file.mimetype);
      if (!ext) throw new Error('头像仅支持 png、jpg、webp、gif');
      const name = `${req.user.id}_${Date.now()}${ext}`;
      const dest = path.join(avatarDir, name);
      await fs.move(req.file.path, dest, { overwrite: false });
      res.json({ user: await userManager.setAvatar(config, req.user.id, '/avatars/' + name) });
    } catch (err) {
      if (req.file) await fs.remove(req.file.path).catch(() => {});
      res.status(400).json({ error: err.message });
    }
  });

  app.get('/api/users', auth, requireAdmin, async (req, res) => {
    try { res.json({ users: await userManager.listUsers(config) }); }
    catch (err) { res.status(500).json({ error: err.message }); }
  });

  app.post('/api/users', auth, requireAdmin, async (req, res) => {
    try { res.json({ user: await userManager.createUser(config, req.body) }); }
    catch (err) { res.status(400).json({ error: err.message }); }
  });

  app.put('/api/users/:id', auth, requireAdmin, async (req, res) => {
    try { res.json({ user: await userManager.updateUser(config, req.params.id, req.body) }); }
    catch (err) { res.status(400).json({ error: err.message }); }
  });

  app.delete('/api/users/:id', auth, requireAdmin, async (req, res) => {
    try { res.json(await userManager.deleteUser(config, req.params.id, req.user.id)); }
    catch (err) { res.status(400).json({ error: err.message }); }
  });

  app.get('/api/status', auth, async (req, res) => {
    res.json({
      local: `http://localhost:${config.server.port}`,
      lan: getLanIPs().map(ip => `http://${ip}:${config.server.port}`),
      tunnel: tunnel.getTunnelState()
    });
  });

  app.get('/api/drives', auth, async (req, res) => {
    try { res.json({ roots: (await fileManager.visibleRoots(config, req.user)).map(({ real, ...r }) => r) }); }
    catch (err) { res.status(500).json({ error: err.message }); }
  });

  app.get('/api/list', auth, async (req, res) => {
    try { res.json(await fileManager.listDir(config, req.query.path, req.user)); }
    catch (err) { res.status(400).json({ error: err.message }); }
  });

  app.get('/api/thumbnail', auth, async (req, res) => {
    try {
      fileManager.ensureActionAllowed(config, req.user, 'download');
      const real = await fileManager.assertAllowed(config, req.query.path, req.user);
      const stat = await fs.stat(real);
      if (!stat.isFile() || !fileManager.isImageFile(real)) return res.status(404).end();
      res.setHeader('Cache-Control', 'private, max-age=3600');
      res.sendFile(real);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/mkdir', auth, async (req, res) => {
    try { res.json(await fileManager.mkdir(config, req.body.path, req.body.name, req.user)); }
    catch (err) { res.status(400).json({ error: err.message }); }
  });

  app.post('/api/delete', auth, async (req, res) => {
    try { res.json(await fileManager.remove(config, req.body.path, req.user)); }
    catch (err) { res.status(400).json({ error: err.message }); }
  });

  app.post('/api/rename', auth, async (req, res) => {
    try { res.json(await fileManager.rename(config, req.body.path, req.body.newName, req.user)); }
    catch (err) { res.status(400).json({ error: err.message }); }
  });

  app.post('/api/copy', auth, async (req, res) => {
    try { res.json(await fileManager.copy(config, req.body.sources || [], req.body.dest, req.user)); }
    catch (err) { res.status(400).json({ error: err.message }); }
  });

  app.post('/api/move', auth, async (req, res) => {
    try { res.json(await fileManager.move(config, req.body.sources || [], req.body.dest, req.user)); }
    catch (err) { res.status(400).json({ error: err.message }); }
  });

  app.post('/api/upload', auth, upload.array('files', 80), async (req, res) => {
    try {
      fileManager.ensureActionAllowed(config, req.user, 'upload');
      const targetDir = await fileManager.assertAllowed(config, req.body.path, req.user);
      const results = [];
      for (const f of req.files || []) {
        const safeName = f.originalname.replace(/[\\/:*?"<>|]/g, '_');
        let dest = path.win32.join(targetDir, safeName);
        if (await fs.pathExists(dest)) {
          const parsed = path.win32.parse(dest);
          dest = path.win32.join(parsed.dir, `${parsed.name}_${Date.now()}${parsed.ext}`);
        }
        await fs.move(f.path, dest, { overwrite: false });
        results.push({ name: safeName, path: dest, size: f.size });
      }
      res.json({ results });
    } catch (err) {
      for (const f of req.files || []) await fs.remove(f.path).catch(() => {});
      res.status(400).json({ error: err.message });
    }
  });

  app.get('/api/download', auth, async (req, res) => {
    try {
      fileManager.ensureActionAllowed(config, req.user, 'download');
      const real = await fileManager.assertAllowed(config, req.query.path, req.user);
      const stat = await fs.stat(real);
      if (stat.isDirectory()) return fileManager.zipFolder(config, real, res, req.user);
      res.download(real);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });


  app.get('/api/properties', auth, async (req, res) => {
    try { res.json(await fileManager.collectStats(config, req.query.path, req.user)); }
    catch (err) { res.status(400).json({ error: err.message }); }
  });

  app.post('/api/zip', auth, async (req, res) => {
    try { res.json(await fileManager.zipSelected(config, req.body.sources || [], req.body.dest, req.user)); }
    catch (err) { res.status(400).json({ error: err.message }); }
  });

  app.post('/api/tunnel/restart', auth, async (req, res) => {
    tunnel.stopTunnel();
    res.json(await tunnel.startTunnel(config));
  });

  app.use((req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

  const requestedPort = Number(config.server.port || 8088);
  const actualPort = await resolveServerPort(config);
  config.server.port = actualPort;
  if (actualPort !== requestedPort) {
    console.log(`[INFO] 端口 ${requestedPort} 不可用，已自动切换到可用端口 ${actualPort}`);
  }

  app.listen(actualPort, config.server.host || '0.0.0.0', async () => {
    console.log(`NAS Lite 已启动: http://localhost:${actualPort}`);
    for (const ip of getLanIPs()) console.log(`局域网访问: http://${ip}:${actualPort}`);
    await tunnel.startTunnel(config);
  });
})();
