# 🚀 Neovim — Cursor-like IDE Configuration

A Neovim configuration that replicates the [Cursor](https://cursor.sh/) editor experience — file tree, Git management, LSP, autocompletion, integrated terminal, and more — all in a single `init.lua`.

---

## ✨ Features / 機能一覧

| Feature | Plugin | Description |
|---|---|---|
| 🎨 Color Scheme | tokyonight.nvim | Modern dark theme |
| 🌳 File Tree | nvim-tree.lua | Sidebar with git status icons |
| 🔍 Fuzzy Finder | telescope.nvim + fzf-native | File / text / symbol search |
| 🖊️ Syntax Highlighting | nvim-treesitter | AST-based accurate highlighting |
| 🧠 LSP | mason + nvim-lspconfig | Auto-install & manage language servers |
| 💡 Autocompletion | nvim-cmp + LuaSnip | IntelliSense-style completion with snippets |
| 📝 Git Gutter | gitsigns.nvim | Inline add/change/delete markers + blame |
| 🔀 Git UI | lazygit.nvim | Full-featured Git TUI |
| 📑 Tab Bar | bufferline.nvim | Tab-style buffer management |
| 💻 Terminal | toggleterm.nvim | Integrated bottom/float/vertical terminal |
| 📏 Indent Guides | indent-blankline.nvim | Visual indent lines |
| 🔒 Auto Pairs | nvim-autopairs | Auto-close brackets & quotes |
| 💬 Comments | Comment.nvim | Toggle comments with `gcc` |
| ⌨️ Key Discovery | which-key.nvim | Shows available keybindings on `<Space>` |
| 🏠 Dashboard | alpha-nvim | Startup screen with quick actions |
| 🔔 UI Enhancement | noice.nvim + nvim-notify | Modern messages & notifications |
| ✅ TODO Highlight | todo-comments.nvim | Highlight TODO / FIXME / HACK |

---

## 📋 Prerequisites / 前提条件

| Requirement | Install |
|---|---|
| **Neovim ≥ 0.9** | `brew install neovim` |
| **Git** | `brew install git` |
| **LazyGit** | `brew install lazygit` |
| **Nerd Font** | [nerdfonts.com](https://www.nerdfonts.com/) — set in your terminal |
| **C compiler** | Xcode CLT (`xcode-select --install`) — for telescope-fzf-native |
| **ripgrep** | `brew install ripgrep` — for Telescope live grep |
| **fd** | `brew install fd` — for Telescope find files (optional) |

---

## 🛠️ Installation / インストール

```bash
# Back up existing config / 既存設定のバックアップ
mv ~/.config/nvim/init.lua ~/.config/nvim/init.lua.bak 2>/dev/null

# Copy this config / この設定をコピー
cp brain/nvim/init.lua ~/.config/nvim/init.lua

# Launch Neovim — plugins install automatically
nvim
```

On first launch, **lazy.nvim** will automatically download and install all plugins. Restart Neovim after installation completes.

初回起動時に **lazy.nvim** が全プラグインを自動ダウンロード・インストールします。完了後に Neovim を再起動してください。

---

## ⌨️ Key Bindings / キーバインド

### General / 一般

| Key | Action |
|---|---|
| `Space` | Leader key |
| `Ctrl+S` | Save file / ファイル保存 |
| `Ctrl+A` | Select all / 全選択 |
| `Esc` | Clear search highlight / 検索ハイライト解除 |
| `Alt+J` / `Alt+K` | Move line down / up — 行を上下移動 |
 
### File Tree / ファイルツリー

| Key | Action |
|---|---|
| `Ctrl+E` | Toggle file tree / ツリー表示切替 |
| `l` | Open file/folder (in tree) / 開く |
| `h` | Close folder (in tree) / フォルダを閉じる |
| `v` | Open vertical split / 縦分割で開く |

### Search / 検索

| Key | Action |
|---|---|
| `Ctrl+P` / `Space ff` | Find files / ファイル検索 |
| `Space fg` | Live grep (global search) / 全文検索 |
| `Space fb` | List buffers / バッファ一覧 |
| `Space fo` | Recent files / 最近のファイル |
| `Space fw` | Find word under cursor / カーソル下の単語を検索 |
| `Space fd` | Find diagnostics / 診断一覧 |
| `Space fs` | Document symbols / ドキュメントシンボル |
| `Space ft` | Find TODOs / TODO 検索 |

### LSP / 言語サーバー

| Key | Action |
|---|---|
| `gd` | Go to definition / 定義へジャンプ |
| `gD` | Go to declaration / 宣言へジャンプ |
| `gi` | Go to implementation / 実装へジャンプ |
| `gr` | Find references / 参照一覧 |
| `K` | Hover documentation / ホバー情報 |
| `Space ca` | Code action / コードアクション |
| `Space rn` | Rename symbol / リネーム |
| `Space f` | Format file / フォーマット |
| `[d` / `]d` | Previous / next diagnostic / 前後の診断 |
| `Space e` | Show diagnostic float / 診断詳細 |

### Git

| Key | Action |
|---|---|
| `Space gg` | Open LazyGit / LazyGit 起動 |
| `Space gf` | LazyGit current file / 現在のファイル |
| `]c` / `[c` | Next / previous hunk / 前後の変更箇所 |
| `Space hs` | Stage hunk / ステージ |
| `Space hr` | Reset hunk / リセット |
| `Space hp` | Preview hunk / プレビュー |
| `Space hb` | Blame line (full) / ブレーム詳細 |
| `Space hd` | Diff this / 差分表示 |

### Buffers & Tabs / バッファ & タブ

| Key | Action |
|---|---|
| `Shift+L` | Next buffer / 次のバッファ |
| `Shift+H` | Previous buffer / 前のバッファ |
| `Space x` | Close buffer / バッファを閉じる |
| `Space bp` | Pin buffer / ピン留め |
| `Space bo` | Close other buffers / 他を閉じる |

### Terminal / ターミナル

| Key | Action |
|---|---|
| `Ctrl+\` | Toggle terminal / ターミナル切替 |
| `Space t` | Toggle terminal / ターミナル切替 |
| `Space tf` | Float terminal / フロートターミナル |
| `Space tv` | Vertical terminal / 縦分割ターミナル |
| `Esc` (in terminal) | Exit terminal mode / ターミナルモード終了 |

### Window Navigation / ウィンドウ移動

| Key | Action |
|---|---|
| `Ctrl+H/J/K/L` | Move between windows / ウィンドウ間移動 |
| `Ctrl+↑/↓/←/→` | Resize windows / ウィンドウサイズ変更 |

---

## 📦 Plugin Management / プラグイン管理

```
:Lazy          — Open plugin manager / プラグインマネージャーを開く
:Mason         — Open LSP installer / LSP インストーラーを開く
:TSInstallInfo — Treesitter parser status / パーサーの状態確認
:checkhealth   — Health check / ヘルスチェック
```

---

## 📁 Structure / 構成

```
brain/nvim/
├── init.lua    ← All-in-one configuration / 全設定ファイル
└── README.md   ← This file / このファイル
```

> **Note:** This config uses a single `init.lua` for simplicity. As it grows, consider splitting into `lua/` modules.
>
> **備考:** シンプルさのため単一の `init.lua` を使用しています。規模が大きくなったら `lua/` ディレクトリへのモジュール分割を検討してください。
