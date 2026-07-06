const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const users = require('./user-manager');

async function verifyLogin(config, username, password) {
  if (!username || !password) return null;
  const user = users.findByUsername(config, username);
  if (!user) return null;
  const ok = await bcrypt.compare(password, user.passwordHash || '');
  return ok ? users.publicUser(user) : null;
}

function signToken(config, user) {
  return jwt.sign({ id: user.id, role: user.role || 'user', username: user.username }, config.server.jwtSecret, { expiresIn: '12h' });
}

function authMiddleware(config) {
  return (req, res, next) => {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : (req.query && req.query.t ? String(req.query.t) : '');
    if (!token) return res.status(401).json({ error: '未登录或登录已过期' });
    try {
      const payload = jwt.verify(token, config.server.jwtSecret);
      const user = users.findById(config, payload.id);
      if (!user) return res.status(401).json({ error: '用户不存在或已被删除' });
      req.user = users.publicUser(user);
      next();
    } catch (err) {
      res.status(401).json({ error: '登录已过期，请重新登录' });
    }
  };
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') return res.status(403).json({ error: '需要管理员权限' });
  next();
}

module.exports = { verifyLogin, signToken, authMiddleware, requireAdmin };
