const path = require('path');
const fs = require('fs-extra');
const { spawn } = require('child_process');

let proc = null;
let state = {
  enabled: false,
  running: false,
  mode: '',
  url: '',
  message: '未启用',
  logs: []
};

function pushLog(line) {
  const text = String(line || '').trim();
  if (!text) return;
  state.logs.push(text);
  if (state.logs.length > 80) state.logs.shift();
  const m = text.match(/https:\/\/[a-zA-Z0-9.-]+\.trycloudflare\.com/);
  if (m) {
    state.url = m[0];
    state.message = 'Quick Tunnel 已连接';
  }
}

async function resolveCloudflared(config) {
  const p = config.cloudflare.cloudflaredPath || 'cloudflared';
  if (/^[a-zA-Z]:[\\/]/.test(p) || p.includes('\\') || p.includes('/')) {
    const abs = path.resolve(path.join(__dirname, '..'), p);
    if (await fs.pathExists(abs)) return abs;
    return null;
  }
  return p;
}

async function startTunnel(config) {
  state.enabled = !!config.cloudflare.enabled;
  state.mode = config.cloudflare.mode || 'quick';
  if (!config.cloudflare.enabled) {
    state.message = '未启用 Cloudflare Tunnel';
    return state;
  }
  if (proc) return state;
  const exe = await resolveCloudflared(config);
  if (!exe) {
    state.running = false;
    state.message = '未找到 cloudflared.exe，请放到 tools/cloudflared.exe 或加入 PATH';
    return state;
  }
  const port = config.server.port;
  let args = [];
  if (state.mode === 'token') {
    if (!config.cloudflare.token) {
      state.message = 'Cloudflare token 为空';
      return state;
    }
    args = ['tunnel', '--no-autoupdate', 'run', '--token', config.cloudflare.token];
    state.url = config.cloudflare.domain || '';
    state.message = state.url ? 'Token Tunnel 启动中：' + state.url : 'Token Tunnel 启动中';
  } else {
    args = ['tunnel', '--no-autoupdate', '--url', `http://localhost:${port}`];
    state.message = 'Quick Tunnel 启动中，正在等待外网地址...';
  }
  if (Array.isArray(config.cloudflare.extraArgs)) args.push(...config.cloudflare.extraArgs);
  proc = spawn(exe, args, { cwd: path.join(__dirname, '..'), windowsHide: true });
  state.running = true;
  proc.stdout.on('data', d => pushLog(d.toString()));
  proc.stderr.on('data', d => pushLog(d.toString()));
  proc.on('exit', code => {
    proc = null;
    state.running = false;
    state.message = 'Cloudflare Tunnel 已退出，代码：' + code;
  });
  return state;
}

function getTunnelState() {
  return state;
}

function stopTunnel() {
  if (proc) {
    proc.kill();
    proc = null;
  }
  state.running = false;
  state.message = '已停止';
  return state;
}

module.exports = { startTunnel, getTunnelState, stopTunnel };
