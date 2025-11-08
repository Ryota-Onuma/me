export ZSH="$HOME/.oh-my-zsh"
ZSH_THEME="robbyrussell"

# Zsh plugins
plugins=(
    git
    fzf
)

source $ZSH/oh-my-zsh.sh


# Preferred editor for local and remote sessions
if [[ -n $SSH_CONNECTION ]]; then
   export EDITOR='vim'
else
   export EDITOR='nvim'
fi


eval "$(starship init zsh)"


# alias

alias vim='nvim'
alias cl='clear'
alias zshrc='vim ~/.zshrc'

alias mv='mv -iv'
alias rm='mv -i ~/Trash'

alias ls='eza --icons'
alias ll='eza -l --icons'
alias la='eza -la --icons'
alias cat='bat --paging=never'
alias mux='tmuxinator'

## path
alias cdd='cd ~/desktop'

## git alias
alias gs='git status'
alias gco='git checkout'
alias gcob='git checkout -b'
alias gf='git fetch'
alias gm='git merge'
alias gl='git log --oneline'
alias gp='git push'
alias gri='git rebase -i'
alias gc='git commit'
alias gb='git branch'

## docker alias
alias dc='docker compose'
alias dup='docker compose up'
alias dce='docker compose exec'


[ -f ~/.private.zsh ] && source ~/.private.zsh

[ -f ~/.fzf.zsh ] && source ~/.fzf.zsh
