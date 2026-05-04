#!/bin/bash
set -e

# Re-write VNC password in case env var was overridden at runtime
mkdir -p /root/.vnc
x11vnc -storepasswd "${VNC_PASSWORD}" /root/.vnc/passwd

# Start supervisord (manages all processes)
exec /usr/bin/supervisord -n -c /etc/supervisor/supervisord.conf
