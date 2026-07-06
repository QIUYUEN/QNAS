const API = (() => {
  const tokenKey = 'nas_lite_token';
  function token() { return localStorage.getItem(tokenKey); }
  function setToken(t) { localStorage.setItem(tokenKey, t); }
  function clearToken() { localStorage.removeItem(tokenKey); }

  async function request(url, options = {}) {
    const headers = options.headers || {};
    if (!(options.body instanceof FormData)) headers['Content-Type'] = 'application/json';
    if (token()) headers.Authorization = 'Bearer ' + token();
    const res = await fetch(url, { ...options, headers });
    const contentType = res.headers.get('content-type') || '';
    const data = contentType.includes('application/json') ? await res.json() : await res.text();
    if (!res.ok) throw new Error(data.error || data || '请求失败');
    return data;
  }

  return {
    token, setToken, clearToken,
    login: (username, password) => request('/api/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
    me: () => request('/api/me'),
    status: () => request('/api/status'),
    drives: () => request('/api/drives'),
    list: (path) => request('/api/list?path=' + encodeURIComponent(path)),
    mkdir: (path, name) => request('/api/mkdir', { method: 'POST', body: JSON.stringify({ path, name }) }),
    remove: (path) => request('/api/delete', { method: 'POST', body: JSON.stringify({ path }) }),
    rename: (path, newName) => request('/api/rename', { method: 'POST', body: JSON.stringify({ path, newName }) }),
    copy: (sources, dest) => request('/api/copy', { method: 'POST', body: JSON.stringify({ sources, dest }) }),
    move: (sources, dest) => request('/api/move', { method: 'POST', body: JSON.stringify({ sources, dest }) }),
    restartTunnel: () => request('/api/tunnel/restart', { method: 'POST', body: '{}' }),
    changePassword: (oldPassword, newPassword) => request('/api/change-password', { method: 'POST', body: JSON.stringify({ oldPassword, newPassword }) }),
    users: () => request('/api/users'),
    createUser: (payload) => request('/api/users', { method: 'POST', body: JSON.stringify(payload) }),
    updateUser: (id, payload) => request('/api/users/' + encodeURIComponent(id), { method: 'PUT', body: JSON.stringify(payload) }),
    deleteUser: (id) => request('/api/users/' + encodeURIComponent(id), { method: 'DELETE' }),
    properties: (path) => request('/api/properties?path=' + encodeURIComponent(path)),
    compressZip: (sources, dest) => request('/api/zip', { method: 'POST', body: JSON.stringify({ sources, dest }) }),
    uploadAvatar: async (file) => {
      const fd = new FormData();
      fd.append('avatar', file);
      return request('/api/me/avatar', { method: 'POST', body: fd, headers: {} });
    },
    upload: async (path, files) => {
      const fd = new FormData();
      fd.append('path', path);
      Array.from(files).forEach(f => fd.append('files', f));
      return request('/api/upload', { method: 'POST', body: fd, headers: {} });
    },
    downloadUrl: (path) => '/api/download?path=' + encodeURIComponent(path) + '&t=' + encodeURIComponent(token()),
    thumbnailUrl: (path) => '/api/thumbnail?path=' + encodeURIComponent(path) + '&t=' + encodeURIComponent(token())
  };
})();
