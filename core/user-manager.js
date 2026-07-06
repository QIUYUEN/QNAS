const fs = require('fs-extra');
const bcrypt = require('bcryptjs');
const { CONFIG_PATH } = require('./config');

const DEFAULT_ACTIONS = {
  download: true,
  upload: true,
  copy: true,
  move: true,
  rename: true,
  delete: true,
  mkdir: true,
  zip: true
};

function safeId(s) {
  return String(s || '').toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 40);
}

function cleanUsername(username) {
  const u = String(username || '').trim();
  if (!/^[A-Za-z0-9_-]{3,32}$/.test(u)) throw new Error('用户名只能使用 3-32 位英文、数字、下划线或横线');
  return u;
}

function normalizePermissions(permissions = {}) {
  const rawPaths = Array.isArray(permissions.allowedPaths) ? permissions.allowedPaths : ['*'];
  const allowedPaths = rawPaths
    .map(x => String(x || '').trim())
    .filter(Boolean)
    .slice(0, 80);
  const actions = { ...DEFAULT_ACTIONS, ...(permissions.actions || {}) };
  for (const k of Object.keys(actions)) actions[k] = !!actions[k];
  return { allowedPaths: allowedPaths.length ? allowedPaths : ['*'], actions };
}

function publicUser(user) {
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName || user.username,
    role: user.role || 'user',
    avatar: user.avatar || '',
    permissions: user.role === 'admin' ? { allowedPaths: ['*'], actions: { ...DEFAULT_ACTIONS } } : normalizePermissions(user.permissions),
    createdAt: user.createdAt || '',
    updatedAt: user.updatedAt || ''
  };
}

async function saveConfig(config) {
  await fs.writeJson(CONFIG_PATH, config, { spaces: 2 });
}

function ensureUsers(config) {
  if (!Array.isArray(config.users)) config.users = [];
  for (const u of config.users) {
    if (!u.permissions && u.role !== 'admin') u.permissions = normalizePermissions();
  }
  return config.users;
}

function findById(config, id) {
  return ensureUsers(config).find(u => u.id === id);
}

function findByUsername(config, username) {
  return ensureUsers(config).find(u => String(u.username).toLowerCase() === String(username).toLowerCase());
}

async function listUsers(config) {
  return ensureUsers(config).map(publicUser);
}

async function createUser(config, payload) {
  const username = cleanUsername(payload.username);
  const password = String(payload.password || '');
  if (password.length < 6) throw new Error('密码至少 6 位');
  if (findByUsername(config, username)) throw new Error('用户名已存在');
  const now = new Date().toISOString();
  let id = safeId(username) || ('user_' + Date.now());
  if (findById(config, id)) id = id + '_' + Date.now();
  const user = {
    id,
    username,
    displayName: username,
    role: 'user',
    avatar: '',
    permissions: normalizePermissions(payload.permissions),
    passwordHash: await bcrypt.hash(password, 10),
    createdAt: now,
    updatedAt: now
  };
  config.users.push(user);
  await saveConfig(config);
  return publicUser(user);
}

async function updateUser(config, id, payload) {
  const user = findById(config, id);
  if (!user) throw new Error('用户不存在');

  // 管理员账户只能改密码，不能改用户名、权限、角色或删除。
  if (user.role === 'admin') {
    if (payload.password) {
      if (String(payload.password).length < 6) throw new Error('密码至少 6 位');
      user.passwordHash = await bcrypt.hash(String(payload.password), 10);
      user.updatedAt = new Date().toISOString();
      await saveConfig(config);
      return publicUser(user);
    }
    throw new Error('管理员账户只能修改密码');
  }

  if (payload.username !== undefined) {
    const username = cleanUsername(payload.username);
    const exists = findByUsername(config, username);
    if (exists && exists.id !== user.id) throw new Error('用户名已存在');
    user.username = username;
    user.displayName = username;
  }
  if (payload.password) {
    if (String(payload.password).length < 6) throw new Error('密码至少 6 位');
    user.passwordHash = await bcrypt.hash(String(payload.password), 10);
  }
  if (payload.permissions !== undefined) {
    user.permissions = normalizePermissions(payload.permissions);
  }
  user.role = 'user';
  user.updatedAt = new Date().toISOString();
  await saveConfig(config);
  return publicUser(user);
}

async function deleteUser(config, id, currentUserId) {
  const user = findById(config, id);
  if (!user) throw new Error('用户不存在');
  if (id === currentUserId) throw new Error('不能删除当前登录用户');
  if (user.role === 'admin') throw new Error('管理员账户不能删除');
  config.users = config.users.filter(u => u.id !== id);
  await saveConfig(config);
  return { ok: true };
}

async function changeOwnPassword(config, userId, oldPassword, newPassword) {
  const user = findById(config, userId);
  if (!user) throw new Error('用户不存在');
  const ok = await bcrypt.compare(String(oldPassword || ''), user.passwordHash || '');
  if (!ok) throw new Error('原密码不正确');
  if (String(newPassword || '').length < 6) throw new Error('新密码至少 6 位');
  user.passwordHash = await bcrypt.hash(String(newPassword), 10);
  user.updatedAt = new Date().toISOString();
  await saveConfig(config);
  return { ok: true };
}

async function setAvatar(config, userId, avatarPath) {
  const user = findById(config, userId);
  if (!user) throw new Error('用户不存在');
  user.avatar = avatarPath;
  user.updatedAt = new Date().toISOString();
  await saveConfig(config);
  return publicUser(user);
}

module.exports = { DEFAULT_ACTIONS, normalizePermissions, publicUser, listUsers, createUser, updateUser, deleteUser, changeOwnPassword, setAvatar, findById, findByUsername, saveConfig };
