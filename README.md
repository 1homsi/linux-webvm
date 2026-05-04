# linux-webvm

A browser-based Linux terminal workspace. Multiple named workspaces, tabs per workspace, full PTY sessions — accessible at **http://localhost:3000**.

## Stack

| Layer | Tool |
|-------|------|
| Runtime | Node.js 20 |
| Terminal backend | node-pty (real PTY sessions) |
| WebSocket | ws |
| HTTP server | Express |
| Terminal frontend | xterm.js 5 |
| Base OS | Ubuntu 22.04 |

## Quick start

```bash
docker build -t linux-webvm .
docker run -d --name linux-webvm -p 3000:3000 linux-webvm
```

Open **http://localhost:3000**

## UI

| Element | Description |
|---------|-------------|
| Left sidebar | Workspaces — click to switch, `✎` to rename, `×` to delete |
| Tab bar | Tabs within the active workspace — `+` to add, `×` to close, double-click to rename |
| Terminal | Full PTY: colors, cursor, history, keyboard shortcuts all work |

## Keyboard shortcuts (inside terminal)

Works like any real Linux terminal — Ctrl+C, Ctrl+L, Tab completion, arrow history, etc.

## Install apps

```bash
sudo apt-get update && sudo apt-get install -y <package>
```

## Persist data across restarts

```bash
docker run -d --name linux-webvm -p 3000:3000 \
  -v linux-webvm-home:/root \
  linux-webvm
```

## Stop / remove

```bash
docker stop linux-webvm && docker rm linux-webvm
```
