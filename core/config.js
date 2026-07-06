const fs = require('fs-extra');
const path = require('path');
const bcrypt = require('bcryptjs');

const CONFIG_PATH = path.join(__dirname, '..', 'config.json');

async function loadConfig() {
  const cfg = await fs.readJson(CONFIG_PATH);
  if (!cfg.server) cfg.server = { host: '0.0.0.0', port: 8088 };
  if (!cfg.server.jwtSecret || cfg.server.jwtSecret === 'please-change-this-random-secret') {
    console.warn('[WARN] 请修改 config.json 中的 server.jwtSecret。');
  }
  if (!cfg.fileAccess) cfg.fileAccess = {};
  if (cfg.fileAccess.hideHiddenFiles === undefined) cfg.fileAccess.hideHiddenFiles = true;

  // 兼容旧版单管理员配置，自动迁移为 users 数组。
  if (!Array.isArray(cfg.users)) {
    cfg.users = [];
    if (cfg.admin) {
      let passwordHash = cfg.admin.passwordHash;
      if (cfg.admin.password && !passwordHash) passwordHash = await bcrypt.hash(cfg.admin.password, 10);
      cfg.users.push({
        id: 'admin',
        username: cfg.admin.username || 'admin',
        displayName: cfg.admin.username || 'admin',
        role: 'admin',
        avatar: '',
        passwordHash: passwordHash || await bcrypt.hash('admin123', 10),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      delete cfg.admin.password;
    }
    await fs.writeJson(CONFIG_PATH, cfg, { spaces: 2 });
    console.log('[INFO] 已迁移为多用户配置。');
  }
  if (!cfg.users.some(u => u.role === 'admin')) {
    cfg.users.push({
      id: 'admin', username: 'admin', displayName: 'admin', role: 'admin', avatar: '',
      passwordHash: await bcrypt.hash('admin123', 10),
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
    });
    await fs.writeJson(CONFIG_PATH, cfg, { spaces: 2 });
  }
  await fs.ensureDir(path.join(__dirname, '..', 'data', 'avatars'));
  return cfg;
}

module.exports = { loadConfig, CONFIG_PATH };
