# linux-webvm

A polished, lightweight Linux desktop running inside Docker, accessible at **http://localhost:3000** via noVNC. Feels like a minimal second machine — not a toy.

## Stack

| Layer | Tool |
|-------|------|
| Base OS | Ubuntu 22.04 |
| Window manager | Openbox |
| Panel | tint2 (launcher + taskbar + systray + clock) |
| Launcher | rofi (fuzzy-search, icon support) |
| Display | Xvfb (virtual framebuffer) |
| VNC | x11vnc |
| Web bridge | noVNC + websockify |
| Process manager | supervisord |
| GTK theme | Arc-Dark |
| Icon theme | Papirus-Dark |
| Fonts | Roboto |
| Notifications | dunst |
| Browser | Firefox (Mozilla apt repo, not snap) |
| Terminal | lxterminal |
| File manager | pcmanfm |

## Quick start

```bash
# Build
docker build -t linux-webvm .

# Run
docker run -d \
  --name linux-webvm \
  -p 3000:3000 \
  --shm-size=512m \
  linux-webvm
```

> `--shm-size=512m` prevents Firefox from crashing on shared memory limits.

Open **http://localhost:3000/vnc.html** → Connect → password: **`password`**

## Override defaults

```bash
# Custom VNC password
-e VNC_PASSWORD=mysecret

# Higher resolution
-e SCREEN_WIDTH=1920 -e SCREEN_HEIGHT=1080

# Persist installed apps and home directory across restarts
-v linux-webvm-home:/root
```

Full example:

```bash
docker run -d \
  --name linux-webvm \
  -p 3000:3000 \
  --shm-size=512m \
  -e VNC_PASSWORD=mysecret \
  -e SCREEN_WIDTH=1920 \
  -e SCREEN_HEIGHT=1080 \
  -v linux-webvm-home:/root \
  linux-webvm
```

## Keyboard shortcuts

| Shortcut | Action |
|----------|--------|
| `Super + Space` | Open app launcher (rofi) |
| `Super + R` | Run command |
| `Super + T` | Terminal |
| `Super + E` | File manager |
| `Super + B` | Firefox |
| `Super + ←` | Tile window left half |
| `Super + →` | Tile window right half |
| `Super + ↑` | Maximize window |
| `Super + ↓` | Restore window |
| `Super + 1 / 2` | Switch workspace |
| `Super + Shift + 1 / 2` | Move window to workspace |
| `Alt + Tab` | Cycle windows |
| `Alt + F4` | Close window |
| Right-click desktop | App menu |

## Install apps inside the container

Open a terminal (`Super+T` or panel icon), then:

```bash
sudo apt-get update
sudo apt-get install -y <package>
```

Examples:

```bash
sudo apt-get install -y gedit        # text editor
sudo apt-get install -y vlc          # media player
sudo apt-get install -y gimp         # image editor
sudo apt-get install -y scrot        # screenshot tool
sudo apt-get install -y code         # VS Code (needs its own repo)
```

## Customise the theme

### GTK theme

Edit `/root/.config/gtk-3.0/settings.ini` inside the container:

```ini
gtk-theme-name = Arc          # Arc, Arc-Dark, Arc-Darker
gtk-icon-theme-name = Papirus # Papirus, Papirus-Dark, Papirus-Light
gtk-font-name = Roboto 11
```

Apply instantly (no restart needed):

```bash
lxappearance   # opens a GUI theme switcher
```

### Wallpaper

```bash
feh --bg-scale /path/to/image.png
```

### Panel

Edit `/root/.config/tint2/tint2rc` then right-click the panel → Restart tint2, or:

```bash
pkill tint2 && tint2 &
```

### Openbox window borders

The window decoration theme is set in `/root/.config/openbox/rc.xml` under `<theme><name>`. Available after installing `arc-theme`:
- `Arc-Dark` (default)
- `Arc`
- `Arc-Darker`

Apply:

```bash
openbox --reconfigure
```

## File structure

```
linux-webvm/
├── Dockerfile
├── start.sh
├── supervisord.conf
├── wallpaper.png
└── config/
    ├── openbox/
    │   ├── rc.xml         # keybindings, theme, margins
    │   ├── autostart      # wallpaper, dunst, tint2, screen settings
    │   └── menu.xml       # right-click desktop menu
    ├── tint2/
    │   └── tint2rc        # panel layout, colors, launcher apps
    ├── rofi/
    │   ├── config.rasi    # launcher behaviour (fuzzy, icons)
    │   └── theme.rasi     # Catppuccin Mocha visual theme
    ├── gtk-3.0/
    │   └── settings.ini   # GTK3 theme/font/icon settings
    ├── dunst/
    │   └── dunstrc        # notification style and timeouts
    ├── .gtkrc-2.0         # GTK2 theme settings
    └── Xresources         # xterm colors + DPI + cursor
```

## Diagnostics

```bash
# Process status
docker exec linux-webvm supervisorctl status

# Logs
docker exec linux-webvm tail -40 /var/log/supervisor/openbox.log
docker exec linux-webvm tail -40 /var/log/supervisor/x11vnc.log
docker exec linux-webvm tail -40 /var/log/supervisor/novnc.log

# Shell inside container
docker exec -it linux-webvm bash
```

## Stop / remove

```bash
docker stop linux-webvm
docker rm linux-webvm
```
