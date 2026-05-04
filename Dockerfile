FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive \
    HOME=/root \
    TERM=xterm-256color \
    COLORTERM=truecolor \
    LANG=en_US.UTF-8 \
    SHELL=/bin/zsh

# ── System tools ──────────────────────────────────────────────────────────────
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl wget git vim nano htop tree jq \
    zip unzip \
    python3 python3-pip \
    build-essential \
    ca-certificates \
    locales \
    sudo \
    zsh \
    zsh-syntax-highlighting \
    zsh-autosuggestions \
    && locale-gen en_US.UTF-8 \
    && chsh -s /bin/zsh root \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# ── Node.js 20 ────────────────────────────────────────────────────────────────
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y --no-install-recommends nodejs && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

COPY zshrc /root/.zshrc

# ── App ───────────────────────────────────────────────────────────────────────
WORKDIR /app
COPY package.json .
RUN npm install

COPY server.js .
COPY public/ ./public/

EXPOSE 3000
CMD ["node", "server.js"]
