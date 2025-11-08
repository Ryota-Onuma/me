# Install oh-my-zsh and zsh pligin

```sh
sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"

git clone https://github.com/zsh-users/zsh-autosuggestions ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-autosuggestions

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
