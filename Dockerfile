FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive \
    DISPLAY=:1 \
    VNC_PASSWORD=password \
    SCREEN_WIDTH=1280 \
    SCREEN_HEIGHT=800 \
    SCREEN_DEPTH=24

RUN apt-get update && apt-get install -y --no-install-recommends \
    # Display
    xvfb \
    x11vnc \
    # Desktop
    openbox \
    obconf \
    # Panel & theming
    tint2 \
    feh \
    gtk2-engines-murrine \
    # Terminal & file manager
    xterm \
    pcmanfm \
    # Browser
    firefox \
    # Fonts
    fonts-dejavu-core \
    fonts-liberation \
    # noVNC dependencies
    novnc \
    websockify \
    python3 \
    # Process manager
    supervisor \
    # Utilities
    dbus-x11 \
    x11-utils \
    x11-xserver-utils \
    curl \
    wget \
    ca-certificates \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Create vnc password file
RUN mkdir -p /root/.vnc && \
    x11vnc -storepasswd "${VNC_PASSWORD}" /root/.vnc/passwd

# Openbox + tint2 config dirs
RUN mkdir -p /root/.config/openbox /root/.config/tint2

COPY config/openbox/rc.xml        /root/.config/openbox/rc.xml
COPY config/openbox/autostart     /root/.config/openbox/autostart
COPY config/openbox/menu.xml      /root/.config/openbox/menu.xml
COPY config/tint2/tint2rc         /root/.config/tint2/tint2rc
COPY wallpaper.png                /root/wallpaper.png

COPY supervisord.conf /etc/supervisor/conf.d/desktop.conf
COPY start.sh /start.sh
RUN chmod +x /start.sh

EXPOSE 3000

CMD ["/start.sh"]
