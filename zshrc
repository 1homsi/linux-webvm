# History
HISTFILE=~/.zsh_history
HISTSIZE=10000
SAVEHIST=10000
setopt HIST_IGNORE_DUPS HIST_FIND_NO_DUPS INC_APPEND_HISTORY SHARE_HISTORY

# Completion
autoload -Uz compinit && compinit
zstyle ':completion:*' menu select
zstyle ':completion:*' list-colors "${(s.:.)LS_COLORS}"

# Prompt
autoload -Uz colors && colors
PROMPT='%F{111}%n%f %F{141}%~%f %F{203}$%f '

# Aliases
alias ls='ls --color=auto'
alias ll='ls -lah --color=auto'
alias la='ls -A --color=auto'
alias grep='grep --color=auto'
alias g='git'

# Plugins (installed via apt)
[ -f /usr/share/zsh-syntax-highlighting/zsh-syntax-highlighting.zsh ] && \
  source /usr/share/zsh-syntax-highlighting/zsh-syntax-highlighting.zsh
[ -f /usr/share/zsh-autosuggestions/zsh-autosuggestions.zsh ] && \
  source /usr/share/zsh-autosuggestions/zsh-autosuggestions.zsh

ZSH_AUTOSUGGEST_HIGHLIGHT_STYLE='fg=240'
