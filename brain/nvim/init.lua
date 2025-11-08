-- =============================================================================
-- 1. LAZY.NVIM BOOTSTRAP (AUTOMATIC INSTALLER)
-- =============================================================================

local lazypath = vim.fn.stdpath('data') .. '/lazy/lazy.nvim'
if not vim.loop.fs_stat(lazypath) then
  vim.fn.system({
    'git',
    'clone',
    '--filter=blob:none',
    'https://github.com/folke/lazy.nvim.git',
    '--branch=stable',
    lazypath,
  })
end
vim.opt.rtp:prepend(lazypath)

-- =============================================================================
-- 2. CORE VIM OPTIONS
-- =============================================================================

-- [Basic Display]
vim.opt.number = true
vim.opt.relativenumber = true
vim.opt.cursorline = true
vim.cmd('syntax enable')
vim.opt.termguicolors = true

-- [Indentation and Tabs]
vim.opt.tabstop = 4
vim.opt.shiftwidth = 4
vim.opt.expandtab = true
vim.opt.autoindent = true
vim.opt.smartindent = true

-- [Search]
vim.opt.ignorecase = true
vim.opt.smartcase = true
vim.opt.hlsearch = true
vim.opt.incsearch = true

-- [Usability and Interface]
vim.opt.mouse = 'a'
vim.opt.backspace = 'indent,eol,start'
vim.opt.clipboard = 'unnamedplus'
vim.opt.cmdheight = 1
vim.opt.completeopt = 'menu,menuone,noselect'

-- [Performance and Convenience]
vim.opt.undofile = true
vim.opt.updatetime = 300
vim.opt.hidden = true
vim.opt.wrap = false

-- [Keymap Leader Setting (Using Space)]
vim.g.mapleader = ' '
vim.g.maplocalleader = ' '

-- =============================================================================
-- 3. LAZY.NVIM PLUGIN SETUP
-- =============================================================================

require('lazy').setup({

  -- ---------------------------------------------------------------------------
  -- Plugin 1: Color Scheme (Tokyonight)
  -- ---------------------------------------------------------------------------
  {
    'folke/tokyonight.nvim',
    lazy = false,
    priority = 1000,
    config = function()
      vim.cmd.colorscheme('tokyonight')
      require('tokyonight').setup({ style = 'storm' })
    end,
  },

  -- ---------------------------------------------------------------------------
  -- Plugin 2: A fuzzy finder (Telescope)
  -- ---------------------------------------------------------------------------
  {
    'nvim-telescope/telescope.nvim',
    branch = '0.1.x',
    dependencies = { 'nvim-lua/plenary.nvim' },
    config = function()
      local builtin = require('telescope.builtin')
      
      -- Ctrl+F でファイル検索
      -- (Note: Telescope はポップアップです。閉じるのは <Esc> が標準です)
      vim.keymap.set('n', '<C-f>', builtin.find_files, { desc = 'Find Files (Ctrl+F)' })
      
      -- 他の便利なキーマップ
      vim.keymap.set('n', '<leader>fg', builtin.live_grep, { desc = 'Live Grep' })
      vim.keymap.set('n', '<leader>fb', builtin.buffers, { desc = 'Find Buffers' })
    end,
  },
  
  -- ---------------------------------------------------------------------------
  -- Plugin 3: A status line (Lualine)
  -- ---------------------------------------------------------------------------
  {
    'nvim-lualine/lualine.nvim',
    dependencies = { 'nvim-tree/nvim-web-devicons' },
    config = function()
      require('lualine').setup({
        options = {
          theme = 'tokyonight',
          icons_enabled = true,
          component_separators = { left = '', right = ''},
          section_separators = { left = '', right = ''},
        },
      })
    end,
  },

  -- ---------------------------------------------------------------------------
  -- Plugin 4: File Tree (nvim-tree)
  -- ---------------------------------------------------------------------------
  {
    'nvim-tree/nvim-tree.lua',
    dependencies = { 'nvim-tree/nvim-web-devicons' },
    config = function()
      local nvimtree = require('nvim-tree')

      -- この on_attach 関数が鍵です
      -- ツリーが開かれるたびに、そのツリーのウィンドウ内でのみ有効なキーマップを設定します
      local function on_attach(bufnr)
        local api = require('nvim-tree.api')
        local opts = { buffer = bufnr, noremap = true, silent = true, nowait = true }

        -- [FIX] ツリーウィンドウ内でも Ctrl+E でトグル(閉じる)できるように設定
        vim.keymap.set('n', '<C-e>', api.tree.toggle, opts)
        
        -- (参考) デフォルトでは 'q' で閉じます
        vim.keymap.set('n', 'q', api.tree.close, opts)
      end

      nvimtree.setup({
        -- (重要) ツリーが開かれるときに on_attach 関数を実行する
        on_attach = on_attach,
        
        view = {
          width = 30,
        },
        
        -- (推奨) ツリーを開いたときに自動でフォーカスしない設定
        -- (false にすると、<C-e>で開いてもカーソルは元のファイルに残ります)
        update_focused_file = {
          enable = false,
        },
        -- (推奨) ファイルを開いたらツリーを自動で閉じる
        -- quit_on_open = true, 
      })
      
      -- メインウィンドウから <C-e> で開くためのキーマップ
      vim.keymap.set('n', '<C-e>', ':NvimTreeToggle<CR>', { 
        desc = 'Toggle File Tree (Ctrl+E)' 
      })
    end,
  },

}, {
  -- lazy.nvim UI settings
  ui = {
    border = 'rounded',
  },
  -- Performance settings
  performance = {
    rtp = {
      disabled_plugins = {
        'gzip',
        'matchit',
        'matchparen',
        'netrwPlugin',
        'tarPlugin',
        'tohtml',
        'tutor',
        'zipPlugin',
      },
    },
  },
})
