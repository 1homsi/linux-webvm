# linux-webvm

A lightweight Linux desktop running in Docker, accessible at **http://localhost:3000** via noVNC.

## Stack

| Layer | Tool |
|-------|------|
| Base OS | Ubuntu 22.04 |
| Desktop | Openbox |
| Panel | tint2 |
| Display | Xvfb (virtual framebuffer) |
| VNC | x11vnc |
| Web bridge | noVNC + websockify |
| Process manager | supervisord |

## Build

```bash
docker build -t linux-webvm .
```

## Run

```bash
docker run -d \
  --name linux-webvm \
  -p 3000:3000 \
  --shm-size=512m \
  linux-webvm
```

> `--shm-size=512m` is recommended so Firefox doesn't crash.

## Open

Navigate to **http://localhost:3000/vnc.html** in your browser.

- Click **Connect**
- Password: **password**

## Override the VNC password

```bash
docker run -d \
  --name linux-webvm \
  -p 3000:3000 \
  --shm-size=512m \
  -e VNC_PASSWORD=mysecret \
  linux-webvm
```

## Change resolution

```bash
docker run -d \
  --name linux-webvm \
  -p 3000:3000 \
  --shm-size=512m \
  -e SCREEN_WIDTH=1920 \
  -e SCREEN_HEIGHT=1080 \
  linux-webvm
```

## Install apps inside the container

Open a terminal (right-click desktop → Terminal, or Ctrl+F2):

```bash
sudo apt-get update
sudo apt-get install -y <package-name>
```

Examples:

```bash
# Code editor
sudo apt-get install -y gedit

# Media player
sudo apt-get install -y vlc

# Image viewer
sudo apt-get install -y eog
```

## Persisting installed apps

Mount a volume so apt changes survive restarts:

```bash
docker run -d \
  --name linux-webvm \
  -p 3000:3000 \
  --shm-size=512m \
  -v linux-webvm-home:/root \
  linux-webvm
```

## Desktop shortcuts

| Shortcut | Action |
|----------|--------|
| Right-click desktop | App menu |
| Ctrl+F2 | Open terminal |
| Ctrl+F1 | Open file manager |
| Alt+drag | Move window |
| Alt+right-drag | Resize window |
| Double-click titlebar | Maximize |

## Stop / remove

```bash
docker stop linux-webvm
docker rm linux-webvm
```

## Logs

```bash
docker exec linux-webvm supervisorctl status
docker exec linux-webvm tail -f /var/log/supervisor/openbox.log
```
