# Install oh-my-zsh and zsh pligin

```sh
sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"

touch brain/shell/.private.zsh
cp brain/shell/.private.zsh ~/.private.zsh
cp brain/shell/.zshrc ~/.zshrc
```

# Install starship and font

```sh
brew install starship
brew install --cask font-caskaydia-cove-nerd-font
mkdir ~/.config
cp brain/shell/starship.toml ~/.config/starship.toml
```

# Change terminal font configuration to use font-caskaydia-cove-nerd-font

![Change](./images/font-config.png)


# Install neovim

```sh
brew install neovim
mkdir -p ~/.config/nvim/
cp brain/nvim/init.lua ~/.config/nvim/init.lua
```

# Install tmux

```sh
brew install tmux
cp brain/shell/.tmux.conf ~/.tmux.conf
git clone https://github.com/tmux-plugins/tpm ~/.tmux/plugins/tpm
```

# Install util

```sh
brew install bat
brew install eza
brew install fzf
$(brew --prefix)/opt/fzf/install
```



# Update files

```sh
cp brain/shell/.private.zsh ~/.private.zsh && \
cp brain/shell/.zshrc ~/.zshrc && \
cp brain/shell/starship.toml ~/.config/starship.toml && \
cp brain/nvim/init.lua ~/.config/nvim/init.lua && \
cp brain/shell/.tmux.conf ~/.tmux.conf
```