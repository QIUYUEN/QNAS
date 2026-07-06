const $ = (id) => document.getElementById(id);
let currentPath = '';
let currentItems = [];
let selected = new Set();
let clipboard = { mode: '', paths: [] };
let currentUser = null;
let currentLang = localStorage.getItem('qnas_lang') || 'zh';
let viewMode = localStorage.getItem('qnas_view_mode') || 'icon';
let contextTarget = null;
let marquee = { active: false, moved: false, startX: 0, startY: 0 };
let suppressBlankClick = false;

const I18N = {
  zh: {
    loginSubtitle: '轻量级便携式文件管理系统', username: '账号', password: '密码', login: '登录',
    drivesTitle: '磁盘 / 目录', addressTitle: '访问地址', restartTunnel: '开启外网访问', logout: '退出', noDir: '未选择目录',
    open: '打开', iconView: '图标', detailView: '详细信息', back: '返回', upload: '上传', download: '下载', copy: '复制', move: '移动', paste: '粘贴', mkdir: '新建文件夹', rename: '重命名', delete: '删除', cut: '剪切', properties: '属性', compressZip: '压缩为ZIP',
    dropHint: '松开鼠标，将文件上传到当前目录', name: '名称', size: '大小', modifiedAt: '修改时间', chooseDrive: '请选择左侧磁盘',
    accountSettings: '账户设置', profile: '个人资料', changePassword: '修改密码', userManagement: '用户管理', uploadAvatar: '上传头像', oldPassword: '原密码', newPassword: '新密码', savePassword: '保存新密码',
    newUsername: '新用户名，英文/数字/下划线', newDisplayName: '显示名称，可选', newUserPassword: '初始密码，至少6位', normalUser: '普通用户', adminUser: '管理员', createUser: '新增用户', updateAvatar: '更新头像', editUsername: '改用户名', editPermissions: '权限设置', savePermissions: '保存权限', allowedPaths: '访问范围', allowAllPaths: '全部允许访问', pathPermissions: '可访问磁盘 / 文件夹', loadingFolders: '正在读取文件夹...', noFolders: '没有可展开的文件夹', actionPermissions: '操作权限', permDownload: '下载', permUpload: '上传', permCopy: '复制', permMove: '剪切/移动', permRename: '重命名', permDelete: '删除', permMkdir: '新建文件夹', permZip: '压缩ZIP', usernameUpdated: '用户名已修改', permissionsSaved: '权限已保存', inputNewUsername: '输入新用户名，3-32位英文/数字/下划线/横线',
    local: '本机', lan: '局域网', tunnel: 'Tunnel', external: '外网', unknown: '未知', admin: '管理员', user: '普通用户',
    parent: '返回上一级', rootReached: '已经是当前磁盘的根目录', chooseDirFirst: '请先选择目录', uploading: '正在上传...', uploadDone: '上传完成',
    chooseItems: '请先选择文件或文件夹', chooseDelete: '请先选择要删除的项目', confirmDelete: n => `确定删除选中的 ${n} 个项目吗？默认会移动到回收站。`, deleteDone: '删除完成', folderName: '文件夹名称', chooseOne: '请选择一个项目', newName: '新名称', copied: '已复制，进入目标目录后点粘贴', moving: '已准备移动，进入目标目录后点粘贴', chooseTarget: '请先选择目标目录', emptyClipboard: '剪贴板为空', pasteDone: '粘贴完成', cutReady: '已剪切，进入目标目录后点粘贴', zipDone: n => `已压缩为 ${n}`, calculating: '正在计算...', propTitle: '属性', propType: '类型', propFolder: '文件夹', propFile: '文件', propLocation: '位置', propFiles: '文件数量', propFolders: '文件夹数量', propCreated: '创建时间', propAccessed: '访问时间', propTruncated: '统计结果可能不完整',
    selectAvatar: '请选择头像图片', avatarUpdated: '头像已更新', passwordChanged: '密码已修改', resetPassword: '改密码', setNormal: '设为普通', setAdmin: '设为管理员', delUser: '删除', inputNewPassword: '输入新密码，至少6位', confirmDelUser: u => `确定删除用户 ${u} 吗？`, userDeleted: '用户已删除', userCreated: '用户已创建', tunnelRestarted: '已尝试开启外网访问',
    systemDriveWarn: '此为操作系统文件盘，请谨慎操作。', free: '可用', total: '共'
  },
  ja: {
    loginSubtitle: '軽量ポータブルファイル管理システム', username: 'アカウント', password: 'パスワード', login: 'ログイン',
    drivesTitle: 'ディスク / フォルダー', addressTitle: 'アクセス先', restartTunnel: '外部アクセス開始', logout: 'ログアウト', noDir: 'フォルダー未選択',
    open: '開く', iconView: 'アイコン', detailView: '詳細', back: '戻る', upload: 'アップロード', download: 'ダウンロード', copy: 'コピー', move: '移動', paste: '貼り付け', mkdir: '新規フォルダー', rename: '名前変更', delete: '削除', cut: '切り取り', properties: 'プロパティ', compressZip: 'ZIPに圧縮',
    dropHint: '離すと現在のフォルダーへアップロードします', name: '名前', size: 'サイズ', modifiedAt: '更新日時', chooseDrive: '左側のディスクを選択してください',
    accountSettings: 'アカウント設定', profile: 'プロフィール', changePassword: 'パスワード変更', userManagement: 'ユーザー管理', uploadAvatar: 'アバターをアップロード', oldPassword: '現在のパスワード', newPassword: '新しいパスワード', savePassword: '保存',
    newUsername: '新規ユーザー名（英数字/下線）', newDisplayName: '表示名（任意）', newUserPassword: '初期パスワード（6文字以上）', normalUser: '一般ユーザー', adminUser: '管理者', createUser: 'ユーザー追加', updateAvatar: 'アバター更新', editUsername: 'ユーザー名変更', editPermissions: '権限設定', savePermissions: '権限を保存', allowedPaths: 'アクセス範囲', allowAllPaths: 'すべて許可', pathPermissions: 'アクセス可能なディスク / フォルダー', loadingFolders: 'フォルダーを読み込み中...', noFolders: '展開できるフォルダーがありません', actionPermissions: '操作権限', permDownload: 'ダウンロード', permUpload: 'アップロード', permCopy: 'コピー', permMove: '切り取り/移動', permRename: '名前変更', permDelete: '削除', permMkdir: 'フォルダー作成', permZip: 'ZIP圧縮', usernameUpdated: 'ユーザー名を変更しました', permissionsSaved: '権限を保存しました', inputNewUsername: '新しいユーザー名（3〜32文字）',
    local: 'ローカル', lan: 'LAN', tunnel: 'Tunnel', external: '外部', unknown: '不明', admin: '管理者', user: '一般ユーザー',
    parent: '上の階層へ', rootReached: '現在のディスクのルートです', chooseDirFirst: '先にフォルダーを選択してください', uploading: 'アップロード中...', uploadDone: 'アップロード完了',
    chooseItems: 'ファイルまたはフォルダーを選択してください', chooseDelete: '削除する項目を選択してください', confirmDelete: n => `選択した ${n} 件を削除しますか？通常はごみ箱へ移動します。`, deleteDone: '削除完了', folderName: 'フォルダー名', chooseOne: '1件だけ選択してください', newName: '新しい名前', copied: 'コピーしました。移動先で貼り付けしてください', moving: '移動準備完了。移動先で貼り付けしてください', chooseTarget: '移動先フォルダーを選択してください', emptyClipboard: 'クリップボードが空です', pasteDone: '貼り付け完了', cutReady: '切り取りました。移動先で貼り付けしてください', zipDone: n => `${n} に圧縮しました`, calculating: '計算中...', propTitle: 'プロパティ', propType: '種類', propFolder: 'フォルダー', propFile: 'ファイル', propLocation: '場所', propFiles: 'ファイル数', propFolders: 'フォルダー数', propCreated: '作成日時', propAccessed: 'アクセス日時', propTruncated: '集計結果が不完全な可能性があります',
    selectAvatar: 'アバター画像を選択してください', avatarUpdated: 'アバターを更新しました', passwordChanged: 'パスワードを変更しました', resetPassword: 'パス変更', setNormal: '一般にする', setAdmin: '管理者にする', delUser: '削除', inputNewPassword: '新しいパスワード（6文字以上）', confirmDelUser: u => `ユーザー ${u} を削除しますか？`, userDeleted: 'ユーザーを削除しました', userCreated: 'ユーザーを作成しました', tunnelRestarted: '外部アクセスの開始を試行しました',
    systemDriveWarn: 'これはオペレーティングシステムのディスクです。操作にご注意ください。', free: '空き', total: '合計'
  },
  en: {
    loginSubtitle: 'Lightweight portable file manager', username: 'Username', password: 'Password', login: 'Log in',
    drivesTitle: 'Drives / Folders', addressTitle: 'Addresses', restartTunnel: 'Enable external access', logout: 'Log out', noDir: 'No folder selected',
    open: 'Open', iconView: 'Icons', detailView: 'Details', back: 'Back', upload: 'Upload', download: 'Download', copy: 'Copy', move: 'Move', paste: 'Paste', mkdir: 'New folder', rename: 'Rename', delete: 'Delete', cut: 'Cut', properties: 'Properties', compressZip: 'Compress to ZIP',
    dropHint: 'Release to upload files to the current folder', name: 'Name', size: 'Size', modifiedAt: 'Modified', chooseDrive: 'Please choose a drive on the left',
    accountSettings: 'Account settings', profile: 'Profile', changePassword: 'Change password', userManagement: 'User management', uploadAvatar: 'Upload avatar', oldPassword: 'Old password', newPassword: 'New password', savePassword: 'Save password',
    newUsername: 'New username, letters/numbers/underscore', newDisplayName: 'Display name, optional', newUserPassword: 'Initial password, at least 6 characters', normalUser: 'User', adminUser: 'Admin', createUser: 'Create user', updateAvatar: 'Update avatar', editUsername: 'Rename user', editPermissions: 'Permissions', savePermissions: 'Save permissions', allowedPaths: 'Access scope', allowAllPaths: 'Allow all access', pathPermissions: 'Allowed drives / folders', loadingFolders: 'Loading folders...', noFolders: 'No folders to expand', actionPermissions: 'Operation permissions', permDownload: 'Download', permUpload: 'Upload', permCopy: 'Copy', permMove: 'Cut/Move', permRename: 'Rename', permDelete: 'Delete', permMkdir: 'New folder', permZip: 'Compress ZIP', usernameUpdated: 'Username updated', permissionsSaved: 'Permissions saved', inputNewUsername: 'New username, 3-32 letters/numbers/_/-',
    local: 'Local', lan: 'LAN', tunnel: 'Tunnel', external: 'External', unknown: 'Unknown', admin: 'Admin', user: 'User',
    parent: 'Go up', rootReached: 'Already at the drive root', chooseDirFirst: 'Please choose a folder first', uploading: 'Uploading...', uploadDone: 'Upload complete',
    chooseItems: 'Please select files or folders first', chooseDelete: 'Please select items to delete', confirmDelete: n => `Delete ${n} selected item(s)? By default they will be moved to trash.`, deleteDone: 'Deleted', folderName: 'Folder name', chooseOne: 'Please select one item', newName: 'New name', copied: 'Copied. Go to the target folder and click Paste', moving: 'Ready to move. Go to the target folder and click Paste', chooseTarget: 'Please choose a target folder first', emptyClipboard: 'Clipboard is empty', pasteDone: 'Pasted', cutReady: 'Cut. Go to the target folder and click Paste', zipDone: n => `Compressed as ${n}`, calculating: 'Calculating...', propTitle: 'Properties', propType: 'Type', propFolder: 'Folder', propFile: 'File', propLocation: 'Location', propFiles: 'Files', propFolders: 'Folders', propCreated: 'Created', propAccessed: 'Accessed', propTruncated: 'The result may be incomplete',
    selectAvatar: 'Please choose an avatar image', avatarUpdated: 'Avatar updated', passwordChanged: 'Password changed', resetPassword: 'Password', setNormal: 'Make user', setAdmin: 'Make admin', delUser: 'Delete', inputNewPassword: 'Enter a new password, at least 6 characters', confirmDelUser: u => `Delete user ${u}?`, userDeleted: 'User deleted', userCreated: 'User created', tunnelRestarted: 'External access requested',
    systemDriveWarn: 'This is the operating system disk. Please operate carefully.', free: 'free', total: 'total'
  }
};

function t(key, ...args) {
  const value = (I18N[currentLang] && I18N[currentLang][key]) || I18N.zh[key] || key;
  return typeof value === 'function' ? value(...args) : value;
}

function updateViewMode() {
  const drop = $('dropZone');
  if (drop) {
    drop.classList.toggle('icon-view', viewMode === 'icon');
    drop.classList.toggle('detail-view', viewMode === 'detail');
  }
  const iconBtn = $('iconViewBtn');
  const detailBtn = $('detailViewBtn');
  if (iconBtn) iconBtn.classList.toggle('active', viewMode === 'icon');
  if (detailBtn) detailBtn.classList.toggle('active', viewMode === 'detail');
}

function setViewMode(mode) {
  viewMode = mode === 'detail' ? 'detail' : 'icon';
  localStorage.setItem('qnas_view_mode', viewMode);
  updateViewMode();
  updateViewMode();
  renderFiles();
}

function applyLanguage() {
  document.documentElement.lang = currentLang === 'zh' ? 'zh-CN' : (currentLang === 'ja' ? 'ja' : 'en');
  document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => { el.placeholder = t(el.dataset.i18nPlaceholder); });
  document.querySelectorAll('.lang-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.lang === currentLang));
  if (!currentPath) $('currentPath').textContent = t('noDir');
  if (currentUser) setCurrentUser(currentUser);
  loadStatus().catch(() => {});
  renderFiles();
}

function toast(msg) {
  const el = $('toast');
  el.textContent = msg;
  el.classList.remove('hidden');
  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(() => el.classList.add('hidden'), 2600);
}

function showApp(loggedIn) {
  $('loginView').classList.toggle('hidden', loggedIn);
  $('appView').classList.toggle('hidden', !loggedIn);
}

function escapeHtml(s) {
  return String(s == null ? '' : s).replace(/[&<>\"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch]));
}

function userInitial(user) {
  return (user && (user.displayName || user.username) || '?').slice(0, 1).toUpperCase();
}

function renderAvatar(el, user, large = false) {
  if (!el || !user) return;
  el.innerHTML = '';
  if (user.avatar) {
    const img = document.createElement('img');
    img.src = user.avatar;
    img.alt = user.displayName || user.username;
    el.appendChild(img);
  } else {
    el.textContent = userInitial(user);
  }
  el.classList.toggle('avatar-large', large);
}

function setCurrentUser(user) {
  currentUser = user;
  const name = user.displayName || user.username;
  const roleText = user.role === 'admin' ? t('admin') : t('user');
  $('userNameText').textContent = `${name} ${roleText}`;
  renderAvatar($('userAvatar'), user, false);
  renderAvatar($('profileAvatar'), user, true);
  $('profileName').textContent = name;
  $('profileRole').textContent = roleText;
  $('userRoleText').textContent = '';
  $('adminTabBtn').classList.toggle('hidden', user.role !== 'admin');
}

async function login() {
  $('loginError').textContent = '';
  try {
    const data = await API.login($('username').value.trim(), $('password').value);
    API.setToken(data.token);
    setCurrentUser(data.user);
    showApp(true);
    await boot();
  } catch (e) {
    $('loginError').textContent = e.message;
  }
}

async function boot() {
  if (!currentUser) {
    const me = await API.me();
    setCurrentUser(me.user);
  }
  await Promise.all([loadDrives(), loadStatus()]);
}

async function loadStatus() {
  if (!API.token()) return;
  try {
    const s = await API.status();
    const lines = [];
    lines.push(t('local') + '：' + s.local);
    if (s.lan && s.lan.length) lines.push(t('lan') + '：' + s.lan.join(' / '));
    lines.push(t('tunnel') + '：' + (s.tunnel.message || t('unknown')));
    if (s.tunnel.url) lines.push(t('external') + '：' + s.tunnel.url);
    $('addressBox').innerHTML = lines.map(x => `<div>${escapeHtml(x)}</div>`).join('');
  } catch (e) {
    $('addressBox').textContent = e.message;
  }
}

function formatSize(size) {
  if (size == null) return '-';
  const units = ['B','KB','MB','GB','TB'];
  let n = Number(size), i = 0;
  while (n >= 1024 && i < units.length - 1) { n /= 1024; i++; }
  return n.toFixed(i ? 1 : 0) + ' ' + units[i];
}

function driveCapacityText(root) {
  if (root.size == null || root.free == null) return root.path;
  return `${formatSize(root.free)} ${t('free')} / ${formatSize(root.size)}`;
}

function drivePercent(root) {
  if (!root.size || root.free == null) return 0;
  return Math.max(0, Math.min(100, ((root.size - root.free) / root.size) * 100));
}

function driveLetterOf(pathOrRoot) {
  const p = typeof pathOrRoot === 'string' ? pathOrRoot : (pathOrRoot.driveLetter || pathOrRoot.path || '');
  const m = String(p).match(/^([a-zA-Z]:)/);
  return m ? m[1].toUpperCase() : '';
}

function userCan(action) {
  if (!currentUser || currentUser.role === 'admin') return true;
  const actions = currentUser.permissions && currentUser.permissions.actions;
  return !actions || actions[action] !== false;
}

const PERM_ACTIONS = [
  ['download','permDownload'], ['upload','permUpload'], ['copy','permCopy'], ['move','permMove'],
  ['rename','permRename'], ['delete','permDelete'], ['mkdir','permMkdir'], ['zip','permZip']
];

function normalizePerms(u) {
  const p = u && u.permissions || {};
  const actions = Object.assign({ download:true, upload:true, copy:true, move:true, rename:true, delete:true, mkdir:true, zip:true }, p.actions || {});
  const allowedPaths = Array.isArray(p.allowedPaths) && p.allowedPaths.length ? p.allowedPaths : ['*'];
  return { allowedPaths, actions };
}

async function loadDrives() {
  const data = await API.drives();
  $('driveList').innerHTML = '';
  data.roots.forEach(root => {
    const btn = document.createElement('button');
    const percent = drivePercent(root);
    btn.className = 'drive';
    btn.innerHTML = `
      <img class="drive-icon" src="/disk.avif" alt="">
      <div class="drive-main">
        <b>${escapeHtml(root.name || root.path)}</b>
        <small>${escapeHtml(root.path || '')}</small>
        <div class="capacity-text">${escapeHtml(driveCapacityText(root))}</div>
        <div class="capacity-bar"><span style="width:${percent}%"></span></div>
      </div>`;
    btn.onclick = () => {
      document.querySelectorAll('.drive').forEach(d => d.classList.remove('active'));
      btn.classList.add('active');
      if (driveLetterOf(root) === 'C:') alert(t('systemDriveWarn'));
      openDir(root.path);
      closeSidebar();
    };
    $('driveList').appendChild(btn);
  });
}

async function openDir(path) {
  try {
    const data = await API.list(path);
    currentPath = data.path;
    currentItems = data.items;
    selected.clear();
    $('currentPath').textContent = currentPath;
    renderFiles();
  } catch (e) { toast(e.message); }
}

function formatDate(value) {
  if (!value) return '-';
  return new Date(value).toLocaleString();
}

function fileIcon(item) {
  if (item.isDirectory) return '📁';
  if (item.type === 'image') return '🖼️';
  if (item.type === 'video') return '🎬';
  return '📄';
}

function thumbHtml(item) {
  if (item.thumbnail) return `<span class="thumb"><img src="${API.thumbnailUrl(item.path)}" loading="lazy" alt=""></span>`;
  return `<span class="thumb placeholder">${fileIcon(item)}</span>`;
}


function updateSelectionUI() {
  document.querySelectorAll('#fileBody .file-row[data-path]').forEach(row => {
    const isSelected = selected.has(row.dataset.path);
    row.classList.toggle('selected', isSelected);
    const cb = row.querySelector('input[type="checkbox"]');
    if (cb) cb.checked = isSelected;
  });
}

function renderFiles() {
  updateViewMode();
  const body = $('fileBody');
  if (!body) return;
  body.innerHTML = '';
  const hasParent = !!parentPath(currentPath);
  $('emptyState').classList.toggle('hidden', currentItems.length > 0 || hasParent);

  const parent = parentPath(currentPath);
  if (parent && parent !== currentPath) {
    const tr = document.createElement('tr');
    tr.className = 'parent-row file-row';
    tr.dataset.path = parent;
    tr.dataset.kind = 'parent';
    tr.innerHTML = `
      <td class="check"></td>
      <td class="name" data-label="${t('name')}"><span class="thumb placeholder">↩️</span><span class="file-title">${escapeHtml(t('parent'))}</span></td>
      <td data-label="${t('size')}">-</td>
      <td data-label="${t('modifiedAt')}">${escapeHtml(parent)}</td>`;
    tr.onclick = () => openDir(parent);
    tr.oncontextmenu = (e) => {
      e.preventDefault();
      contextTarget = { path: parent, isParent: true, isDirectory: true };
      showContextMenu(e.clientX, e.clientY, 'parent');
    };
    tr.style.animationDelay = '0ms';
    body.appendChild(tr);
  }

  currentItems.forEach((item, index) => {
    const tr = document.createElement('tr');
    tr.className = 'file-row' + (selected.has(item.path) ? ' selected' : '');
    tr.dataset.path = item.path;
    tr.dataset.kind = item.isDirectory ? 'folder' : 'file';
    tr.style.animationDelay = Math.min(index * 22, 420) + 'ms';
    tr.innerHTML = `
      <td class="check"><input type="checkbox" ${selected.has(item.path) ? 'checked' : ''}></td>
      <td class="name" data-label="${t('name')}">${thumbHtml(item)}<span class="file-title">${escapeHtml(item.name)}</span></td>
      <td data-label="${t('size')}">${formatSize(item.size)}</td>
      <td data-label="${t('modifiedAt')}">${formatDate(item.modifiedAt)}</td>`;
    const checkbox = tr.querySelector('input');
    checkbox.onchange = (e) => {
      if (e.target.checked) selected.add(item.path); else selected.delete(item.path);
      updateSelectionUI();
    };
    tr.onclick = (e) => {
      if (e.target.tagName === 'INPUT') return;
      if (item.isDirectory) {
        openDir(item.path);
        return;
      }
      if (selected.has(item.path)) selected.delete(item.path); else selected.add(item.path);
      updateSelectionUI();
    };
    tr.ondblclick = (e) => {
      if (!item.isDirectory) {
        e.preventDefault();
        downloadPath(item.path);
      }
    };
    bindRowContext(tr, item);
    body.appendChild(tr);
  });
}


function bindRowContext(row, item) {
  row.oncontextmenu = (e) => {
    e.preventDefault();
    if (!selected.has(item.path)) {
      selected.clear();
      selected.add(item.path);
      updateSelectionUI();
    }
    contextTarget = item;
    showContextMenu(e.clientX, e.clientY, 'item');
  };

  let touchTimer = null;
  row.addEventListener('touchstart', (e) => {
    touchTimer = setTimeout(() => {
      if (!selected.has(item.path)) {
        selected.clear();
        selected.add(item.path);
        updateSelectionUI();
      }
      const t0 = e.touches[0];
      contextTarget = item;
      showContextMenu(t0.clientX, t0.clientY, 'item');
    }, 520);
  }, { passive: true });
  ['touchend', 'touchmove', 'touchcancel'].forEach(type => row.addEventListener(type, () => clearTimeout(touchTimer), { passive: true }));
}

function showContextMenu(x, y, type = 'blank') {
  const menu = $('contextMenu');
  if (!menu) return;
  menu.classList.remove('hidden');
  menu.querySelectorAll('button').forEach(btn => {
    const a = btn.dataset.action;
    let show = true;
    if (type === 'blank') show = ['back','upload','paste','mkdir'].includes(a);
    if (type === 'parent') show = ['open','back','upload','paste','mkdir'].includes(a);
    if (type === 'item') show = ['open','download','copy','cut','move','rename','properties','zip','delete'].includes(a);
    if (show) {
      const need = { upload:'upload', download:'download', copy:'copy', cut:'move', move:'move', paste: clipboard.mode === 'move' ? 'move' : 'copy', mkdir:'mkdir', rename:'rename', zip:'zip', delete:'delete' }[a];
      if (need && !userCan(need)) show = false;
    }
    btn.classList.toggle('hidden', !show);
  });
  const rect = menu.getBoundingClientRect();
  const left = Math.min(x, window.innerWidth - rect.width - 8);
  const top = Math.min(y, window.innerHeight - rect.height - 8);
  menu.style.left = Math.max(8, left) + 'px';
  menu.style.top = Math.max(8, top) + 'px';
}

function hideContextMenu() {
  const menu = $('contextMenu');
  if (menu) menu.classList.add('hidden');
}

async function handleContextAction(action) {
  hideContextMenu();
  if (action === 'open') {
    if (contextTarget && (contextTarget.isDirectory || contextTarget.isParent)) return openDir(contextTarget.path);
    if (contextTarget && contextTarget.path) return downloadPath(contextTarget.path);
    return;
  }
  if (action === 'back') return goUp();
  if (action === 'upload') return $('fileInput').click();
  if (action === 'download') return downloadSelected();
  if (action === 'copy') return copySelected('copy');
  if (action === 'cut') return copySelected('move', true);
  if (action === 'move') return copySelected('move');
  if (action === 'paste') return paste();
  if (action === 'mkdir') return makeDir();
  if (action === 'rename') return renameSelected();
  if (action === 'properties') return showProperties();
  if (action === 'zip') return compressSelected();
  if (action === 'delete') return deleteSelected();
}

function selectedPaths() { return Array.from(selected); }
function normalizeSlashes(p) { return String(p || '').replace(/\//g, '\\'); }
function isDriveRoot(p) { return /^[a-zA-Z]:\\?$/.test(normalizeSlashes(p)); }
function parentPath(p) {
  const s = normalizeSlashes(p).replace(/\\+$/, '');
  if (!s || isDriveRoot(s + '\\') || isDriveRoot(s)) return '';
  const i = s.lastIndexOf('\\');
  if (i <= 2) return s.slice(0, 3);
  return s.slice(0, i);
}

async function goUp() {
  if (!currentPath) return toast(t('chooseDirFirst'));
  const parent = parentPath(currentPath);
  if (!parent || parent === currentPath) return toast(t('rootReached'));
  await openDir(parent);
}

async function uploadFiles(files) {
  if (!currentPath) return toast(t('chooseDirFirst'));
  if (!files || !files.length) return;
  try {
    toast(t('uploading'));
    await API.upload(currentPath, files);
    toast(t('uploadDone'));
    $('fileInput').value = '';
    await openDir(currentPath);
  } catch (e) { toast(e.message); }
}

function downloadPath(p) { window.open(API.downloadUrl(p), '_blank'); }
async function downloadSelected() {
  const paths = selectedPaths();
  if (!paths.length) return toast(t('chooseItems'));
  paths.forEach(downloadPath);
}
async function deleteSelected() {
  const paths = selectedPaths();
  if (!paths.length) return toast(t('chooseDelete'));
  if (!confirm(t('confirmDelete', paths.length))) return;
  try { for (const p of paths) await API.remove(p); toast(t('deleteDone')); await openDir(currentPath); }
  catch (e) { toast(e.message); }
}
async function makeDir() {
  if (!currentPath) return toast(t('chooseDirFirst'));
  const name = prompt(t('folderName'));
  if (!name) return;
  try { await API.mkdir(currentPath, name); await openDir(currentPath); }
  catch (e) { toast(e.message); }
}
async function renameSelected() {
  const paths = selectedPaths();
  if (paths.length !== 1) return toast(t('chooseOne'));
  const old = currentItems.find(x => x.path === paths[0]);
  const name = prompt(t('newName'), old ? old.name : '');
  if (!name) return;
  try { await API.rename(paths[0], name); await openDir(currentPath); }
  catch (e) { toast(e.message); }
}
function copySelected(mode, isCut = false) {
  const paths = selectedPaths();
  if (!paths.length) return toast(t('chooseItems'));
  clipboard = { mode, paths };
  toast(mode === 'copy' ? t('copied') : (isCut ? t('cutReady') : t('moving')));
}
async function paste() {
  if (!currentPath) return toast(t('chooseTarget'));
  if (!clipboard.paths.length) return toast(t('emptyClipboard'));
  try {
    if (clipboard.mode === 'move') await API.move(clipboard.paths, currentPath);
    else await API.copy(clipboard.paths, currentPath);
    clipboard = { mode: '', paths: [] };
    toast(t('pasteDone'));
    await openDir(currentPath);
  } catch (e) { toast(e.message); }
}


async function showProperties() {
  const paths = selectedPaths();
  if (paths.length !== 1) return toast(t('chooseOne'));
  try {
    toast(t('calculating'));
    const p = await API.properties(paths[0]);
    const lines = [
      `${t('name')}：${p.name}`,
      `${t('propType')}：${p.isDirectory ? t('propFolder') : t('propFile')}`,
      `${t('size')}：${formatSize(p.size)}`,
      `${t('propLocation')}：${p.path}`,
      p.isDirectory ? `${t('propFiles')}：${p.fileCount}` : '',
      p.isDirectory ? `${t('propFolders')}：${p.folderCount}` : '',
      `${t('propCreated')}：${formatDate(p.createdAt)}`,
      `${t('modifiedAt')}：${formatDate(p.modifiedAt)}`,
      `${t('propAccessed')}：${formatDate(p.accessedAt)}`,
      p.truncated ? t('propTruncated') : ''
    ].filter(Boolean);
    alert(`${t('propTitle')}\n\n` + lines.join('\n'));
  } catch (e) { toast(e.message); }
}

async function compressSelected() {
  const paths = selectedPaths();
  if (!paths.length) return toast(t('chooseItems'));
  if (!currentPath) return toast(t('chooseTarget'));
  try {
    toast(t('calculating'));
    const data = await API.compressZip(paths, currentPath);
    toast(t('zipDone', data.name));
    await openDir(currentPath);
  } catch (e) { toast(e.message); }
}

function openSidebar() { $('sidebar').classList.add('open'); }
function closeSidebar() { $('sidebar').classList.remove('open'); }

function openUserModal() {
  $('userModal').classList.remove('hidden');
  switchPanel('profile');
}
function closeUserModal() { $('userModal').classList.add('hidden'); }
function switchPanel(name) {
  ['profile','password','admin'].forEach(n => {
    $(n + 'Panel').classList.toggle('active', n === name);
    $(n + 'TabBtn').classList.toggle('active', n === name);
  });
  if (name === 'admin') loadUsers();
}

async function uploadAvatar() {
  const f = $('avatarInput').files[0];
  if (!f) return toast(t('selectAvatar'));
  try {
    const data = await API.uploadAvatar(f);
    setCurrentUser(data.user);
    $('avatarInput').value = '';
    toast(t('avatarUpdated'));
  } catch (e) { toast(e.message); }
}

async function changePassword() {
  try {
    await API.changePassword($('oldPassword').value, $('newPassword').value);
    $('oldPassword').value = '';
    $('newPassword').value = '';
    toast(t('passwordChanged'));
  } catch (e) { toast(e.message); }
}


async function loadUsers() {
  if (!currentUser || currentUser.role !== 'admin') return;
  try {
    const [data, driveData] = await Promise.all([API.users(), API.drives()]);
    const drives = driveData.roots || [];
    $('userList').innerHTML = data.users.map(u => {
      const perms = normalizePerms(u);
      const isAdmin = u.role === 'admin';
      const actionChecks = PERM_ACTIONS.map(([key, label]) => `
        <label class="perm-check"><input type="checkbox" data-perm-action="${key}" ${perms.actions[key] ? 'checked' : ''}> ${escapeHtml(t(label))}</label>
      `).join('');
      return `
      <div class="user-item ${isAdmin ? 'is-admin-user' : ''}" data-id="${escapeHtml(u.id)}">
        <span class="avatar-mini">${u.avatar ? `<img src="${escapeHtml(u.avatar)}" alt="">` : escapeHtml(userInitial(u))}</span>
        <div class="user-meta"><b>${escapeHtml(u.displayName || u.username)}</b><small>${escapeHtml(u.username)} · ${isAdmin ? t('admin') : t('user')}</small></div>
        <button class="small reset-pass">${escapeHtml(t('resetPassword'))}</button>
        ${isAdmin ? '' : `<button class="small edit-username">${escapeHtml(t('editUsername'))}</button><button class="small edit-perms">${escapeHtml(t('editPermissions'))}</button><button class="small danger del-user">${escapeHtml(t('delUser'))}</button>`}
        ${isAdmin ? '' : `<div class="perm-editor hidden">
          <div class="perm-title">${escapeHtml(t('pathPermissions'))}</div>
          <label class="perm-all-check"><input type="checkbox" class="allow-all-paths" ${perms.allowedPaths.includes('*') ? 'checked' : ''}> ${escapeHtml(t('allowAllPaths'))}</label>
          <div class="perm-tree" data-loaded="0"></div>
          <div class="perm-title">${escapeHtml(t('actionPermissions'))}</div>
          <div class="perm-checks">${actionChecks}</div>
          <button class="small save-perms">${escapeHtml(t('savePermissions'))}</button>
        </div>`}
      </div>`;
    }).join('');

    $('userList').querySelectorAll('.user-item').forEach(row => {
      const id = row.dataset.id;
      const u = data.users.find(x => x.id === id);
      const perms = normalizePerms(u);
      row.querySelector('.reset-pass').onclick = async () => {
        const password = prompt(t('inputNewPassword'));
        if (!password) return;
        try { await API.updateUser(id, { password }); toast(t('passwordChanged')); }
        catch (e) { toast(e.message); }
      };
      const editName = row.querySelector('.edit-username');
      if (editName) editName.onclick = async () => {
        const username = prompt(t('inputNewUsername'), u.username);
        if (!username || username === u.username) return;
        try { await API.updateUser(id, { username }); toast(t('usernameUpdated')); await loadUsers(); }
        catch (e) { toast(e.message); }
      };
      const editPerms = row.querySelector('.edit-perms');
      if (editPerms) editPerms.onclick = async () => {
        const editor = row.querySelector('.perm-editor');
        editor.classList.toggle('hidden');
        if (!editor.classList.contains('hidden') && editor.querySelector('.perm-tree').dataset.loaded !== '1') {
          renderPermissionTree(editor.querySelector('.perm-tree'), drives, perms.allowedPaths);
          bindPermissionTree(editor);
        }
      };
      const savePerms = row.querySelector('.save-perms');
      if (savePerms) savePerms.onclick = async () => {
        const actions = {};
        row.querySelectorAll('[data-perm-action]').forEach(ch => { actions[ch.dataset.permAction] = ch.checked; });
        const allowedPaths = collectPermissionPaths(row.querySelector('.perm-editor'));
        try { await API.updateUser(id, { permissions: { allowedPaths, actions } }); toast(t('permissionsSaved')); await loadUsers(); }
        catch (e) { toast(e.message); }
      };
      const del = row.querySelector('.del-user');
      if (del) del.onclick = async () => {
        if (!confirm(t('confirmDelUser', u.username))) return;
        try { await API.deleteUser(id); await loadUsers(); toast(t('userDeleted')); }
        catch (e) { toast(e.message); }
      };
    });
  } catch (e) { toast(e.message); }
}

function renderPermissionTree(container, drives, allowedPaths) {
  const all = allowedPaths.includes('*');
  container.dataset.loaded = '1';
  container.innerHTML = (drives || []).map(root => permissionNodeHtml(root, all || allowedPaths.includes(normalizeSlashes(root.path)), 0, true)).join('');
}

function permissionNodeHtml(item, checked, level = 0, expandable = true) {
  const pathValue = normalizeSlashes(item.path);
  const title = item.name || item.path;
  return `<div class="perm-node" data-path="${escapeHtml(pathValue)}" data-level="${level}" data-expanded="0" data-children-loaded="0">
    <div class="perm-node-row" style="padding-left:${level * 18}px">
      <button type="button" class="perm-expand" ${expandable ? '' : 'disabled'}>▸</button>
      <label><input type="checkbox" class="perm-path-check" value="${escapeHtml(pathValue)}" ${checked ? 'checked' : ''}> <span>${escapeHtml(title)}</span><small>${escapeHtml(pathValue)}</small></label>
    </div>
    <div class="perm-children"></div>
  </div>`;
}

function bindPermissionTree(editor) {
  const allBox = editor.querySelector('.allow-all-paths');
  const tree = editor.querySelector('.perm-tree');
  function syncDisabled() { tree.classList.toggle('disabled', allBox.checked); }
  allBox.onchange = syncDisabled;
  syncDisabled();
  tree.addEventListener('change', e => {
    const cb = e.target.closest('.perm-path-check');
    if (!cb) return;
    allBox.checked = false;
    syncDisabled();
    const node = cb.closest('.perm-node');
    node.querySelectorAll('.perm-children .perm-path-check').forEach(child => { child.checked = cb.checked; });
  });
  tree.addEventListener('click', async e => {
    const btn = e.target.closest('.perm-expand');
    if (!btn || btn.disabled) return;
    const node = btn.closest('.perm-node');
    await togglePermissionNode(node);
  });
}

async function togglePermissionNode(node) {
  const children = node.querySelector(':scope > .perm-children');
  const btn = node.querySelector(':scope > .perm-node-row .perm-expand');
  const expanded = node.dataset.expanded === '1';
  if (expanded) {
    node.dataset.expanded = '0';
    btn.textContent = '▸';
    children.classList.add('hidden');
    return;
  }
  if (node.dataset.childrenLoaded !== '1') {
    children.innerHTML = `<div class="perm-loading">${escapeHtml(t('loadingFolders'))}</div>`;
    try {
      const data = await API.list(node.dataset.path);
      const dirs = (data.items || []).filter(x => x.isDirectory);
      const parentChecked = node.querySelector(':scope > .perm-node-row .perm-path-check').checked;
      children.innerHTML = dirs.length
        ? dirs.map(d => permissionNodeHtml(d, parentChecked, Number(node.dataset.level || 0) + 1, true)).join('')
        : `<div class="perm-loading">${escapeHtml(t('noFolders'))}</div>`;
      node.dataset.childrenLoaded = '1';
    } catch (e) {
      children.innerHTML = `<div class="perm-loading error-text">${escapeHtml(e.message)}</div>`;
    }
  }
  children.classList.remove('hidden');
  node.dataset.expanded = '1';
  btn.textContent = '▾';
}

function collectPermissionPaths(editor) {
  if (!editor || editor.querySelector('.allow-all-paths').checked) return ['*'];
  const raw = Array.from(editor.querySelectorAll('.perm-path-check:checked')).map(x => normalizeSlashes(x.value)).filter(Boolean);
  const sorted = Array.from(new Set(raw)).sort((a, b) => a.length - b.length);
  const result = [];
  for (const p of sorted) {
    const pLow = p.toLowerCase();
    const covered = result.some(parent => {
      const root = parent.endsWith('\\') ? parent.toLowerCase() : (parent + '\\').toLowerCase();
      return pLow === parent.toLowerCase() || pLow.startsWith(root);
    });
    if (!covered) result.push(p);
  }
  return result.length ? result : ['*'];
}


async function createUser() {
  try {
    await API.createUser({
      username: $('newUsername').value.trim(),
      password: $('newUserPassword').value
    });
    $('newUsername').value = '';
    $('newUserPassword').value = '';
    toast(t('userCreated'));
    await loadUsers();
  } catch (e) { toast(e.message); }
}


$('loginBtn').onclick = login;
$('password').addEventListener('keydown', e => { if (e.key === 'Enter') login(); });
$('logoutBtn').onclick = () => { API.clearToken(); currentUser = null; showApp(false); };
$('fileInput').onchange = e => uploadFiles(e.target.files);
$('iconViewBtn').onclick = () => setViewMode('icon');
$('detailViewBtn').onclick = () => setViewMode('detail');
$('restartTunnelBtn').onclick = async () => { await API.restartTunnel(); setTimeout(loadStatus, 2000); toast(t('tunnelRestarted')); };
$('openSidebarBtn').onclick = openSidebar;
$('closeSidebarBtn').onclick = closeSidebar;
$('userBtn').onclick = openUserModal;
$('closeUserModalBtn').onclick = closeUserModal;
$('profileTabBtn').onclick = () => switchPanel('profile');
$('passwordTabBtn').onclick = () => switchPanel('password');
$('adminTabBtn').onclick = () => switchPanel('admin');
$('uploadAvatarBtn').onclick = uploadAvatar;
$('changePasswordBtn').onclick = changePassword;
$('createUserBtn').onclick = createUser;
$('userModal').addEventListener('click', e => { if (e.target.id === 'userModal') closeUserModal(); });

$('contextMenu').addEventListener('click', e => {
  const btn = e.target.closest('button[data-action]');
  if (!btn) return;
  handleContextAction(btn.dataset.action);
});
document.addEventListener('click', e => {
  if (!$('contextMenu').contains(e.target)) hideContextMenu();
});
document.addEventListener('keydown', e => { if (e.key === 'Escape') hideContextMenu(); });
$('dropZone').addEventListener('contextmenu', e => {
  if (e.target.closest('.file-row')) return;
  e.preventDefault();
  contextTarget = null;
  showContextMenu(e.clientX, e.clientY, 'blank');
});

$('dropZone').addEventListener('click', e => {
  if (suppressBlankClick) { suppressBlankClick = false; return; }
  if (e.target.closest('.file-row') || e.target.closest('#contextMenu')) return;
  if (selected.size) {
    selected.clear();
    updateSelectionUI();
  }
});

function rectsIntersect(a, b) {
  return !(a.right < b.left || a.left > b.right || a.bottom < b.top || a.top > b.bottom);
}

function updateSelectionBox(e) {
  const box = $('selectionBox');
  const x = Math.min(marquee.startX, e.clientX);
  const y = Math.min(marquee.startY, e.clientY);
  const w = Math.abs(e.clientX - marquee.startX);
  const h = Math.abs(e.clientY - marquee.startY);
  box.style.left = x + 'px';
  box.style.top = y + 'px';
  box.style.width = w + 'px';
  box.style.height = h + 'px';
  box.classList.remove('hidden');
  const selRect = { left: x, top: y, right: x + w, bottom: y + h };
  selected.clear();
  document.querySelectorAll('#fileBody .file-row[data-kind="file"], #fileBody .file-row[data-kind="folder"]').forEach(row => {
    const r = row.getBoundingClientRect();
    if (rectsIntersect(selRect, r)) selected.add(row.dataset.path);
  });
  updateSelectionUI();
}

$('dropZone').addEventListener('mousedown', e => {
  if (e.button !== 0 || e.target.closest('.file-row') || e.target.closest('button') || e.target.closest('input')) return;
  if (!currentPath) return;
  marquee = { active: true, moved: false, startX: e.clientX, startY: e.clientY };
});

document.addEventListener('mousemove', e => {
  if (!marquee.active) return;
  const dist = Math.abs(e.clientX - marquee.startX) + Math.abs(e.clientY - marquee.startY);
  if (dist < 6 && !marquee.moved) return;
  marquee.moved = true;
  suppressBlankClick = true;
  updateSelectionBox(e);
});

document.addEventListener('mouseup', () => {
  if (!marquee.active) return;
  $('selectionBox').classList.add('hidden');
  marquee.active = false;
  if (marquee.moved) updateSelectionUI();
});

document.querySelectorAll('.lang-btn').forEach(btn => {
  btn.onclick = async () => {
    currentLang = btn.dataset.lang;
    localStorage.setItem('qnas_lang', currentLang);
    applyLanguage();
    await loadDrives().catch(() => {});
  };
});

function hasDraggedFiles(e) { return Array.from(e.dataTransfer && e.dataTransfer.types || []).includes('Files'); }
['dragenter', 'dragover'].forEach(type => {
  document.addEventListener(type, e => {
    if (!hasDraggedFiles(e)) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    $('dropZone').classList.add('drag');
  });
});
['dragleave', 'drop'].forEach(type => {
  document.addEventListener(type, e => {
    if (!hasDraggedFiles(e)) return;
    e.preventDefault();
    if (type === 'drop') uploadFiles(e.dataTransfer.files);
    $('dropZone').classList.remove('drag');
  });
});

applyLanguage();
setInterval(() => { if (API.token()) loadStatus(); }, 8000);
if (API.token()) {
  showApp(true);
  boot().catch(() => { API.clearToken(); currentUser = null; showApp(false); });
} else showApp(false);
