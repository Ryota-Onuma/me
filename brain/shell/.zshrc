export ZSH="$HOME/.oh-my-zsh"
ZSH_THEME="robbyrussell"

# Zsh plugins
plugins=(git)

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
