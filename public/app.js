'use strict';

// ── Palette for workspace dots ────────────────────────────────────────────────
const COLORS = [
  '#89b4fa', '#a6e3a1', '#f9e2af', '#f38ba8',
  '#cba6f7', '#94e2d5', '#fab387', '#f5c2e7',
];

// ── State ─────────────────────────────────────────────────────────────────────
let workspaces = [];          // [{ id, name, color, tabIds[], activeTabId }]
let activeWsId = null;

// Live sessions: tabId → { term, socket, fitAddon, pane, name }
const sessions = new Map();

// ── Utils ─────────────────────────────────────────────────────────────────────
let _seq = 0;
const uid  = () => `${Date.now()}-${++_seq}`;
const esc  = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const findWs  = id => workspaces.find(w => w.id === id);
const activeWs = ()  => findWs(activeWsId);

// ── Persistence ───────────────────────────────────────────────────────────────
function save() {
  localStorage.setItem('twv2', JSON.stringify({
    activeWsId,
    workspaces: workspaces.map(ws => ({ id: ws.id, name: ws.name, color: ws.color })),
  }));
}

// ── Workspace ops ─────────────────────────────────────────────────────────────
function createWorkspace(name) {
  const id    = uid();
  const color = COLORS[workspaces.length % COLORS.length];
  const ws    = { id, name, color, tabIds: [], activeTabId: null };
  workspaces.push(ws);
  activeWsId = id;
  save();
  renderSidebar();
  createTab(id, 'bash');
}

function deleteWorkspace(id) {
  if (workspaces.length <= 1) return;
  const ws = findWs(id);
  if (!ws) return;
  ws.tabIds.forEach(destroySession);
  workspaces = workspaces.filter(w => w.id !== id);
  if (activeWsId === id) {
    activeWsId = workspaces[0].id;
    activateWorkspace(activeWsId);
  }
  save();
  renderSidebar();
}

function activateWorkspace(id) {
  activeWsId = id;
  const ws = findWs(id);
  renderSidebar();
  renderTabBar();
  if (!ws) return;
  if (ws.activeTabId && sessions.has(ws.activeTabId)) {
    activateTab(ws.activeTabId);
  } else if (ws.tabIds.length > 0) {
    activateTab(ws.tabIds[0]);
  } else {
    createTab(id, 'bash');
  }
}

// ── Tab ops ───────────────────────────────────────────────────────────────────
function createTab(wsId, name = 'bash') {
  const ws = findWs(wsId);
  if (!ws) return;
  const tabId = uid();
  ws.tabIds.push(tabId);
  ws.activeTabId = tabId;
  openSession(tabId, name);
  if (activeWsId === wsId) {
    renderTabBar();
    activateTab(tabId);
  }
}

function closeTab(tabId) {
  const ws = workspaces.find(w => w.tabIds.includes(tabId));
  if (!ws) return;
  destroySession(tabId);
  ws.tabIds = ws.tabIds.filter(t => t !== tabId);
  if (ws.tabIds.length === 0) {
    createTab(ws.id, 'bash');
    return;
  }
  if (ws.activeTabId === tabId) {
    ws.activeTabId = ws.tabIds.at(-1);
    if (activeWsId === ws.id) { renderTabBar(); activateTab(ws.activeTabId); }
  } else if (activeWsId === ws.id) {
    renderTabBar();
  }
}

function activateTab(tabId) {
  const ws = activeWs();
  if (ws) ws.activeTabId = tabId;
  sessions.forEach((s, tid) => s.pane.classList.toggle('active', tid === tabId));
  renderTabBar();
  const s = sessions.get(tabId);
  if (s) requestAnimationFrame(() => { try { s.fitAddon.fit(); } catch {} s.term.focus(); });
}

// ── Session (xterm + WebSocket) ───────────────────────────────────────────────
function openSession(tabId, name) {
  // DOM pane
  const pane = document.createElement('div');
  pane.className = 'term-pane';
  document.getElementById('terminal-root').appendChild(pane);

  // xterm
  const term = new Terminal({
    fontFamily: "'JetBrains Mono','Fira Code','Cascadia Code','SF Mono',Menlo,Monaco,Consolas,monospace",
    fontSize:       14,
    lineHeight:     1.35,
    cursorBlink:    true,
    cursorStyle:    'bar',
    cursorWidth:    2,
    scrollback:     10000,
    tabStopWidth:   4,
    allowTransparency: false,
    macOptionIsMeta: true,
    theme: {
      background:    '#1e1e2e',
      foreground:    '#cdd6f4',
      cursor:        '#f5e0dc',
      cursorAccent:  '#1e1e2e',
      selectionBackground: 'rgba(88,91,112,0.6)',
      black:         '#45475a', brightBlack:   '#585b70',
      red:           '#f38ba8', brightRed:     '#f38ba8',
      green:         '#a6e3a1', brightGreen:   '#a6e3a1',
      yellow:        '#f9e2af', brightYellow:  '#f9e2af',
      blue:          '#89b4fa', brightBlue:    '#89b4fa',
      magenta:       '#f5c2e7', brightMagenta: '#f5c2e7',
      cyan:          '#94e2d5', brightCyan:    '#94e2d5',
      white:         '#bac2de', brightWhite:   '#a6adc8',
    },
  });

  // Resolve FitAddon constructor (UMD global may be a namespace or class directly)
  const FitCtor  = (typeof FitAddon  === 'function') ? FitAddon  : FitAddon.FitAddon;
  const fitAddon = new FitCtor();
  term.loadAddon(fitAddon);

  try {
    const LinkCtor     = (typeof WebLinksAddon === 'function') ? WebLinksAddon : WebLinksAddon.WebLinksAddon;
    term.loadAddon(new LinkCtor());
  } catch {}

  term.open(pane);
  try { fitAddon.fit(); } catch {}

  // WebSocket
  const proto  = location.protocol === 'https:' ? 'wss:' : 'ws:';
  const socket = new WebSocket(`${proto}//${location.host}/terminal`);

  socket.onopen = () => {
    socket.send(JSON.stringify({ t: 'r', c: term.cols, r: term.rows }));
  };

  socket.onmessage = ({ data }) => {
    try {
      const msg = JSON.parse(data);
      if (msg.t === 'd') term.write(msg.d);
      if (msg.t === 'x') term.write('\r\n\x1b[2m[session ended — press Enter to start a new one]\x1b[0m\r\n');
    } catch {}
  };

  socket.onerror = () =>
    term.write('\r\n\x1b[31m[connection error — is the server running?]\x1b[0m\r\n');

  term.onData(d => {
    if (socket.readyState === WebSocket.OPEN)
      socket.send(JSON.stringify({ t: 'i', d }));
  });

  term.onResize(({ cols, rows }) => {
    if (socket.readyState === WebSocket.OPEN)
      socket.send(JSON.stringify({ t: 'r', c: cols, r: rows }));
  });

  sessions.set(tabId, { term, socket, fitAddon, pane, name });
}

function destroySession(tabId) {
  const s = sessions.get(tabId);
  if (!s) return;
  try { s.socket.close(); } catch {}
  try { s.term.dispose();  } catch {}
  s.pane.remove();
  sessions.delete(tabId);
}

// ── Render ────────────────────────────────────────────────────────────────────
function renderSidebar() {
  const list = document.getElementById('workspace-list');
  list.innerHTML = '';
  workspaces.forEach(ws => {
    const active = ws.id === activeWsId;
    const el = document.createElement('div');
    el.className = 'ws-item' + (active ? ' active' : '');
    el.innerHTML = `
      <div class="ws-dot" style="background:${ws.color}"></div>
      <span class="ws-label">${esc(ws.name)}</span>
      <span class="ws-badge">${ws.tabIds.length}</span>
      <div class="ws-actions">
        <button class="ws-act-btn ren" title="Rename">✎</button>
        ${workspaces.length > 1 ? `<button class="ws-act-btn del" title="Delete">×</button>` : ''}
      </div>`;

    el.addEventListener('click', e => {
      if (e.target.closest('.ws-actions')) return;
      activateWorkspace(ws.id);
    });

    el.querySelector('.ren')?.addEventListener('click', e => {
      e.stopPropagation();
      inlineRename(ws, 'name', el.querySelector('.ws-label'), () => { save(); renderSidebar(); });
    });

    el.querySelector('.del')?.addEventListener('click', e => {
      e.stopPropagation();
      deleteWorkspace(ws.id);
    });

    list.appendChild(el);
  });
}

function renderTabBar() {
  const ws   = activeWs();
  const list = document.getElementById('tab-list');
  list.innerHTML = '';
  if (!ws) return;

  ws.tabIds.forEach(tabId => {
    const s      = sessions.get(tabId);
    const name   = s?.name ?? 'bash';
    const active = tabId === ws.activeTabId;

    const tab = document.createElement('div');
    tab.className = 'tab' + (active ? ' active' : '');
    tab.innerHTML = `
      <span class="tab-icon">›_</span>
      <span class="tab-name">${esc(name)}</span>
      <button class="tab-close" title="Close">×</button>`;

    tab.addEventListener('click', e => {
      if (e.target.closest('.tab-close')) return;
      activateTab(tabId);
    });

    tab.addEventListener('dblclick', e => {
      if (e.target.closest('.tab-close')) return;
      if (!s) return;
      inlineRename(s, 'name', tab.querySelector('.tab-name'), renderTabBar);
    });

    tab.querySelector('.tab-close').addEventListener('click', e => {
      e.stopPropagation();
      closeTab(tabId);
    });

    list.appendChild(tab);
  });
}

// ── Inline rename ─────────────────────────────────────────────────────────────
function inlineRename(obj, prop, el, onDone) {
  const input = document.createElement('input');
  input.className = 'rename-input';
  input.value = obj[prop];
  el.replaceWith(input);
  input.focus();
  input.select();
  const commit = () => { const v = input.value.trim(); if (v) obj[prop] = v; onDone(); };
  input.addEventListener('blur', commit);
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter')  { e.preventDefault(); input.blur(); }
    if (e.key === 'Escape') { onDone(); }
  });
}

// ── Resize observer ───────────────────────────────────────────────────────────
new ResizeObserver(() => {
  const ws = activeWs();
  if (!ws?.activeTabId) return;
  const s = sessions.get(ws.activeTabId);
  if (s?.fitAddon) try { s.fitAddon.fit(); } catch {}
}).observe(document.getElementById('terminal-root'));

// ── Wire buttons ──────────────────────────────────────────────────────────────
document.getElementById('btn-new-ws').addEventListener('click', () =>
  createWorkspace('Workspace ' + (workspaces.length + 1))
);

document.getElementById('btn-new-tab').addEventListener('click', () => {
  if (activeWsId) createTab(activeWsId, 'bash');
});

// ── Init ──────────────────────────────────────────────────────────────────────
(function init() {
  let saved = null;
  try { saved = JSON.parse(localStorage.getItem('twv2')); } catch {}

  if (saved?.workspaces?.length) {
    saved.workspaces.forEach(sw => {
      workspaces.push({ id: sw.id, name: sw.name, color: sw.color, tabIds: [], activeTabId: null });
    });
    activeWsId = saved.activeWsId && findWs(saved.activeWsId)
      ? saved.activeWsId
      : workspaces[0].id;

    renderSidebar();
    renderTabBar();
    // Fresh session for each restored workspace (PTY state is ephemeral)
    workspaces.forEach((ws, i) => {
      const tabId = uid();
      ws.tabIds.push(tabId);
      ws.activeTabId = tabId;
      openSession(tabId, 'bash');
      if (ws.id !== activeWsId) sessions.get(tabId)?.pane.classList.remove('active');
    });
    activateWorkspace(activeWsId);
  } else {
    createWorkspace('main');
  }
})();
