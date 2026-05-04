FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive \
    HOME=/root \
    TERM=xterm-256color \
    COLORTERM=truecolor \
    LANG=en_US.UTF-8 \
    SHELL=/bin/bash

# ── System tools ──────────────────────────────────────────────────────────────
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl wget git vim nano htop tree jq \
    zip unzip \
    python3 python3-pip \
    build-essential \
    ca-certificates \
    locales \
    sudo \
    && locale-gen en_US.UTF-8 \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# ── Node.js 20 ────────────────────────────────────────────────────────────────
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y --no-install-recommends nodejs && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# ── Nice shell defaults ───────────────────────────────────────────────────────
RUN printf '\n\
# Colors & prompt\n\
export PS1="\\[\\e[38;5;111m\\]\\u\\[\\e[0m\\] \\[\\e[38;5;141m\\]\\w\\[\\e[0m\\] \\[\\e[38;5;203m\\]\$\\[\\e[0m\\] "\n\
export LS_COLORS="di=1;34:ln=36:so=32:pi=33:ex=1;32:bd=1;33:cd=1;33:su=37;41:sg=30;43:tw=30;42:ow=34;42"\n\
alias ls="ls --color=auto"\n\
alias ll="ls -lah --color=auto"\n\
alias la="ls -A --color=auto"\n\
alias grep="grep --color=auto"\n\
' >> /root/.bashrc

# ── App ───────────────────────────────────────────────────────────────────────
WORKDIR /app
COPY package.json .
RUN npm install

COPY server.js .
COPY public/ ./public/

EXPOSE 3000
CMD ["node", "server.js"]
