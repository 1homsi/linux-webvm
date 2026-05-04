const express    = require('express');
const http       = require('http');
const { WebSocketServer } = require('ws');
const pty        = require('node-pty');
const path       = require('path');
const os         = require('os');

const app    = express();
const server = http.createServer(app);
const wss    = new WebSocketServer({ server, path: '/terminal' });

app.use(express.static(path.join(__dirname, 'public')));

wss.on('connection', (socket) => {
  const shell = process.env.SHELL || '/bin/bash';

  const proc = pty.spawn(shell, ['--login'], {
    name:  'xterm-256color',
    cols:  80,
    rows:  24,
    cwd:   process.env.HOME || '/root',
    env:   {
      ...process.env,
      TERM:       'xterm-256color',
      COLORTERM:  'truecolor',
      LANG:       'en_US.UTF-8',
    },
  });

  // PTY → browser
  proc.onData(data => {
    if (socket.readyState === 1) {
      socket.send(JSON.stringify({ t: 'd', d: data }));
    }
  });

  proc.onExit(({ exitCode }) => {
    if (socket.readyState === 1) {
      socket.send(JSON.stringify({ t: 'x', code: exitCode }));
    }
  });

  // Browser → PTY
  socket.on('message', (raw) => {
    try {
      const msg = JSON.parse(raw);
      if (msg.t === 'i') proc.write(msg.d);
      if (msg.t === 'r') proc.resize(Math.max(2, msg.c), Math.max(2, msg.r));
    } catch {}
  });

  socket.on('close',  () => { try { proc.kill(); } catch {} });
  socket.on('error',  () => { try { proc.kill(); } catch {} });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Terminal workspace → http://localhost:${PORT}`);
});
