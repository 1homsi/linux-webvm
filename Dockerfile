FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive \
    DISPLAY=:1 \
    VNC_PASSWORD=password \
    SCREEN_WIDTH=1280 \
    SCREEN_HEIGHT=800 \
    SCREEN_DEPTH=24 \
    HOME=/root \
    LANG=en_US.UTF-8

# ── Base system ───────────────────────────────────────────────────────────────
RUN apt-get update && apt-get install -y --no-install-recommends \
    # Display stack
    xvfb \
    x11vnc \
    # Window manager + panel
    openbox \
    obconf \
    tint2 \
    # Wallpaper
    feh \
    # Launcher
    rofi \
    # GTK theming
    arc-theme \
    gtk2-engines-murrine \
    gtk2-engines-pixbuf \
    lxappearance \
    # Icon + cursor themes
    papirus-icon-theme \
    xcursor-themes \
    adwaita-icon-theme-full \
    # Fonts
    fonts-roboto \
    fonts-dejavu-core \
    fonts-liberation \
    # Terminal + file manager
    lxterminal \
    xterm \
    pcmanfm \
    gvfs \
    # Notifications
    dunst \
    libnotify-bin \
    # noVNC
    novnc \
    websockify \
    python3 \
    # Process manager
    supervisor \
    # Utilities
    dbus-x11 \
    x11-utils \
    x11-xserver-utils \
    numlockx \
    xdotool \
    curl \
    wget \
    gpg \
    ca-certificates \
    software-properties-common \
    locales \
    && locale-gen en_US.UTF-8 \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# ── Firefox via Mozilla official apt repo (avoids Ubuntu snap redirect) ───────
RUN install -d -m 0755 /etc/apt/keyrings && \
    curl -fsSL https://packages.mozilla.org/apt/repo-signing-key.gpg \
        | gpg --dearmor -o /etc/apt/keyrings/packages.mozilla.org.gpg && \
    echo "deb [signed-by=/etc/apt/keyrings/packages.mozilla.org.gpg] \
https://packages.mozilla.org/apt mozilla main" \
        > /etc/apt/sources.list.d/mozilla.list && \
    printf 'Package: *\nPin: origin packages.mozilla.org\nPin-Priority: 1000\n' \
        > /etc/apt/preferences.d/mozilla && \
    apt-get update && apt-get install -y --no-install-recommends firefox && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# ── VNC password ──────────────────────────────────────────────────────────────
RUN mkdir -p /root/.vnc && \
    x11vnc -storepasswd "${VNC_PASSWORD}" /root/.vnc/passwd

# ── Config directory tree ─────────────────────────────────────────────────────
RUN mkdir -p \
    /root/.config/openbox \
    /root/.config/tint2 \
    /root/.config/rofi \
    /root/.config/gtk-3.0 \
    /root/.config/dunst

# Openbox
COPY config/openbox/rc.xml      /root/.config/openbox/rc.xml
COPY config/openbox/autostart   /root/.config/openbox/autostart
COPY config/openbox/menu.xml    /root/.config/openbox/menu.xml

# tint2 panel
COPY config/tint2/tint2rc       /root/.config/tint2/tint2rc

# rofi launcher
COPY config/rofi/config.rasi    /root/.config/rofi/config.rasi
COPY config/rofi/theme.rasi     /root/.config/rofi/theme.rasi

# GTK theming
COPY config/gtk-3.0/settings.ini /root/.config/gtk-3.0/settings.ini
COPY config/.gtkrc-2.0           /root/.gtkrc-2.0

# X resources (xterm colors)
COPY config/Xresources           /root/.Xresources

# dunst notifications
COPY config/dunst/dunstrc        /root/.config/dunst/dunstrc

# Wallpaper
COPY wallpaper.png               /root/wallpaper.png

# Entry point
COPY supervisord.conf /etc/supervisor/conf.d/desktop.conf
COPY start.sh /start.sh
RUN chmod +x /start.sh

EXPOSE 3000

CMD ["/start.sh"]
