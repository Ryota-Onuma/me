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
vim.opt.signcolumn = 'yes' -- Always show sign column (for git/diagnostic indicators)
vim.opt.scrolloff = 8 -- Keep 8 lines visible above/below cursor
vim.opt.sidescrolloff = 8

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
vim.opt.pumheight = 10 -- Max completion menu height
vim.opt.showmode = false -- Lualine handles this
vim.opt.splitbelow = true -- Horizontal splits go below
vim.opt.splitright = true -- Vertical splits go right

-- [Performance and Convenience]
vim.opt.undofile = true
vim.opt.updatetime = 250
vim.opt.hidden = true
vim.opt.wrap = false
vim.opt.timeoutlen = 300 -- Faster which-key popup

-- [Keymap Leader Setting (Using Space)]
vim.g.mapleader = ' '
vim.g.maplocalleader = ' '

-- =============================================================================
-- 3. LAZY.NVIM PLUGIN SETUP
-- =============================================================================

require('lazy').setup({

  -- ---------------------------------------------------------------------------
  -- Color Scheme (Tokyonight)
  -- ---------------------------------------------------------------------------
  {
    'folke/tokyonight.nvim',
    lazy = false,
    priority = 1000,
    config = function()
      require('tokyonight').setup({
        style = 'storm',
        transparent = false,
        styles = {
          sidebars = 'dark',
          floats = 'dark',
        },
      })
      vim.cmd.colorscheme('tokyonight')

      -- Visual モードの選択色: 黄色背景 + 黒文字
      vim.api.nvim_set_hl(0, 'Visual', { bg = '#FFD700', fg = '#000000' })
    end,
  },

  -- ---------------------------------------------------------------------------
  -- Icons (dependency for many plugins)
  -- ---------------------------------------------------------------------------
  { 'nvim-tree/nvim-web-devicons', lazy = true },

  -- ---------------------------------------------------------------------------
  -- Fuzzy Finder (Telescope) — Cursor's Cmd+P, Cmd+Shift+F
  -- ---------------------------------------------------------------------------
  {
    'nvim-telescope/telescope.nvim',
    dependencies = {
      'nvim-lua/plenary.nvim',
      { 'nvim-telescope/telescope-fzf-native.nvim', build = 'make' },
    },
    config = function()
      local telescope = require('telescope')
      local actions = require('telescope.actions')
      local builtin = require('telescope.builtin')

      telescope.setup({
        defaults = {
          prompt_prefix = '   ',
          selection_caret = '  ',
          path_display = { 'truncate' },
          sorting_strategy = 'ascending',
          layout_config = {
            horizontal = {
              prompt_position = 'top',
              preview_width = 0.55,
            },
            width = 0.87,
            height = 0.80,
          },
          mappings = {
            i = {
              ['<C-j>'] = actions.move_selection_next,
              ['<C-k>'] = actions.move_selection_previous,
              ['<C-q>'] = actions.send_selected_to_qflist + actions.open_qflist,
              ['<Esc>'] = actions.close,
            },
          },
          file_ignore_patterns = {
            'node_modules',
            '.git/',
            'dist/',
            'build/',
            '%.lock',
          },
        },
      })

      -- Load fzf extension for better performance
      pcall(telescope.load_extension, 'fzf')

      -- Keymaps (Cursor-like)
      vim.keymap.set('n', '<C-p>', builtin.find_files, { desc = 'Find Files (Ctrl+P)' })
      vim.keymap.set('n', '<leader>ff', builtin.find_files, { desc = 'Find Files' })
      vim.keymap.set('n', '<leader>fg', builtin.live_grep, { desc = 'Live Grep (Global Search)' })
      vim.keymap.set('n', '<leader>fb', builtin.buffers, { desc = 'Find Buffers' })
      vim.keymap.set('n', '<leader>fh', builtin.help_tags, { desc = 'Help Tags' })
      vim.keymap.set('n', '<leader>fo', builtin.oldfiles, { desc = 'Recent Files' })
      vim.keymap.set('n', '<leader>fw', builtin.grep_string, { desc = 'Find Word Under Cursor' })
      vim.keymap.set('n', '<leader>fd', builtin.diagnostics, { desc = 'Find Diagnostics' })
      vim.keymap.set('n', '<leader>fs', builtin.lsp_document_symbols, { desc = 'Document Symbols' })
      vim.keymap.set('n', '<leader>fS', builtin.lsp_workspace_symbols, { desc = 'Workspace Symbols' })
    end,
  },

  -- ---------------------------------------------------------------------------
  -- Treesitter (Syntax Highlighting)
  -- ---------------------------------------------------------------------------
  {
    'nvim-treesitter/nvim-treesitter',
    lazy = false,
    build = ':TSUpdate',
    config = function()
      require('nvim-treesitter').setup({
        install_dir = vim.fn.stdpath('data') .. '/site',
      })

      -- Parsers are installed via :TSUpdate (run by lazy.nvim on install)
      -- You can manually install others with: :TSInstall <language>

      -- Enable treesitter highlighting for all supported filetypes
      vim.api.nvim_create_autocmd('FileType', {
        callback = function()
          -- Only start if a parser for this filetype exists
          if pcall(vim.treesitter.start) then
            -- Also enable treesitter-based indentation
            vim.bo.indentexpr = "v:lua.require'nvim-treesitter'.indentexpr()"
          end
        end,
      })
    end,
  },

  -- ---------------------------------------------------------------------------
  -- LSP: Mason (Language Server Installer)
  -- ---------------------------------------------------------------------------
  {
    'williamboman/mason.nvim',
    build = ':MasonUpdate',
    config = function()
      require('mason').setup({
        ui = {
          border = 'rounded',
          icons = {
            package_installed = '✓',
            package_pending = '➜',
            package_uninstalled = '✗',
          },
        },
      })
    end,
  },

  -- ---------------------------------------------------------------------------
  -- LSP: Mason-Lspconfig (Bridge between Mason and lspconfig)
  -- ---------------------------------------------------------------------------
  {
    'williamboman/mason-lspconfig.nvim',
    dependencies = { 'williamboman/mason.nvim', 'neovim/nvim-lspconfig' },
    config = function()
      require('mason-lspconfig').setup({
        ensure_installed = {
          'lua_ls',       -- Lua
          'ts_ls',        -- TypeScript/JavaScript
          'pyright',      -- Python
          'gopls',        -- Go
          'jsonls',       -- JSON
          'yamlls',       -- YAML
          'html',         -- HTML
          'cssls',        -- CSS
          'bashls',       -- Bash
        },
        -- Automatically enable installed servers via vim.lsp.enable()
        automatic_enable = true,
      })
    end,
  },

  -- ---------------------------------------------------------------------------
  -- LSP: nvim-lspconfig (LSP Configuration)
  -- ---------------------------------------------------------------------------
  {
    'neovim/nvim-lspconfig',
    dependencies = {
      'hrsh7th/cmp-nvim-lsp',
    },
    config = function()
      local cmp_nvim_lsp = require('cmp_nvim_lsp')

      -- Enhanced capabilities from nvim-cmp
      local capabilities = cmp_nvim_lsp.default_capabilities()

      -- Diagnostic display settings (Cursor-like)
      vim.diagnostic.config({
        virtual_text = {
          prefix = '●',
          spacing = 4,
        },
        signs = {
          text = {
            [vim.diagnostic.severity.ERROR] = ' ',
            [vim.diagnostic.severity.WARN] = ' ',
            [vim.diagnostic.severity.HINT] = '󰌵 ',
            [vim.diagnostic.severity.INFO] = ' ',
          },
        },
        underline = true,
        update_in_insert = false,
        severity_sort = true,
        float = {
          border = 'rounded',
          source = true,
        },
      })

      -- Diagnostic signs (Legacy definitions for plugins like nvim-tree that expect them)
      local signs = { Error = ' ', Warn = ' ', Hint = '󰌵 ', Info = ' ' }
      for type, icon in pairs(signs) do
        local hl = 'DiagnosticSign' .. type
        pcall(vim.fn.sign_define, hl, { text = icon, texthl = hl, numhl = '' })
      end

      -- Configure LSP servers via vim.lsp.config (Neovim 0.11+ built-in)
      vim.lsp.config('*', {
        capabilities = capabilities,
      })

      -- Lua specific config
      vim.lsp.config('lua_ls', {
        settings = {
          Lua = {
            runtime = { version = 'LuaJIT' },
            diagnostics = { globals = { 'vim' } },
            workspace = {
              library = vim.api.nvim_get_runtime_file('', true),
              checkThirdParty = false,
            },
            telemetry = { enable = false },
          },
        },
      })

      -- LSP keymaps via LspAttach autocmd (Neovim 0.11+ pattern)
      vim.api.nvim_create_autocmd('LspAttach', {
        callback = function(ev)
          local opts = { buffer = ev.buf, noremap = true, silent = true }
          -- Navigation
          vim.keymap.set('n', 'gd', vim.lsp.buf.definition, vim.tbl_extend('force', opts, { desc = 'Go to Definition' }))
          vim.keymap.set('n', 'gD', vim.lsp.buf.declaration, vim.tbl_extend('force', opts, { desc = 'Go to Declaration' }))
          vim.keymap.set('n', 'gi', vim.lsp.buf.implementation, vim.tbl_extend('force', opts, { desc = 'Go to Implementation' }))
          vim.keymap.set('n', 'gr', vim.lsp.buf.references, vim.tbl_extend('force', opts, { desc = 'Find References' }))
          vim.keymap.set('n', 'gt', vim.lsp.buf.type_definition, vim.tbl_extend('force', opts, { desc = 'Type Definition' }))
          -- Info
          vim.keymap.set('n', 'K', vim.lsp.buf.hover, vim.tbl_extend('force', opts, { desc = 'Hover Documentation' }))
          vim.keymap.set('n', '<C-k>', vim.lsp.buf.signature_help, vim.tbl_extend('force', opts, { desc = 'Signature Help' }))
          -- Actions
          vim.keymap.set('n', '<leader>ca', vim.lsp.buf.code_action, vim.tbl_extend('force', opts, { desc = 'Code Action' }))
          vim.keymap.set('n', '<leader>rn', vim.lsp.buf.rename, vim.tbl_extend('force', opts, { desc = 'Rename Symbol' }))
          vim.keymap.set('n', '<leader>f', function() vim.lsp.buf.format({ async = true }) end, vim.tbl_extend('force', opts, { desc = 'Format File' }))
          -- Diagnostics
          vim.keymap.set('n', '[d', vim.diagnostic.goto_prev, vim.tbl_extend('force', opts, { desc = 'Previous Diagnostic' }))
          vim.keymap.set('n', ']d', vim.diagnostic.goto_next, vim.tbl_extend('force', opts, { desc = 'Next Diagnostic' }))
          vim.keymap.set('n', '<leader>e', vim.diagnostic.open_float, vim.tbl_extend('force', opts, { desc = 'Show Diagnostic' }))
          vim.keymap.set('n', '<leader>q', vim.diagnostic.setloclist, vim.tbl_extend('force', opts, { desc = 'Diagnostic List' }))
        end,
      })
    end,
  },

  -- ---------------------------------------------------------------------------
  -- Autocompletion (nvim-cmp) — Cursor's IntelliSense
  -- ---------------------------------------------------------------------------
  {
    'hrsh7th/nvim-cmp',
    event = 'InsertEnter',
    dependencies = {
      'hrsh7th/cmp-nvim-lsp',     -- LSP source
      'hrsh7th/cmp-buffer',       -- Buffer source
      'hrsh7th/cmp-path',         -- Path source
      'hrsh7th/cmp-cmdline',      -- Cmdline source
      'L3MON4D3/LuaSnip',        -- Snippet engine
      'saadparwaiz1/cmp_luasnip', -- Snippet source
      'rafamadriz/friendly-snippets', -- Snippet collection
      'onsails/lspkind.nvim',     -- VS Code-like icons in completion
    },
    config = function()
      local cmp = require('cmp')
      local luasnip = require('luasnip')
      local lspkind = require('lspkind')

      -- Load friendly-snippets
      require('luasnip.loaders.from_vscode').lazy_load()

      cmp.setup({
        snippet = {
          expand = function(args)
            luasnip.lsp_expand(args.body)
          end,
        },
        window = {
          completion = cmp.config.window.bordered({
            winhighlight = 'Normal:Normal,FloatBorder:FloatBorder,CursorLine:Visual,Search:None',
          }),
          documentation = cmp.config.window.bordered(),
        },
        mapping = cmp.mapping.preset.insert({
          ['<C-b>'] = cmp.mapping.scroll_docs(-4),
          ['<C-f>'] = cmp.mapping.scroll_docs(4),
          ['<C-Space>'] = cmp.mapping.complete(),
          ['<C-e>'] = cmp.mapping.abort(),
          ['<CR>'] = cmp.mapping.confirm({ select = true }),
          ['<Tab>'] = cmp.mapping(function(fallback)
            if cmp.visible() then
              cmp.select_next_item()
            elseif luasnip.expand_or_jumpable() then
              luasnip.expand_or_jump()
            else
              fallback()
            end
          end, { 'i', 's' }),
          ['<S-Tab>'] = cmp.mapping(function(fallback)
            if cmp.visible() then
              cmp.select_prev_item()
            elseif luasnip.jumpable(-1) then
              luasnip.jump(-1)
            else
              fallback()
            end
          end, { 'i', 's' }),
        }),
        sources = cmp.config.sources({
          { name = 'nvim_lsp', priority = 1000 },
          { name = 'luasnip', priority = 750 },
          { name = 'buffer', priority = 500 },
          { name = 'path', priority = 250 },
        }),
        formatting = {
          format = lspkind.cmp_format({
            mode = 'symbol_text',
            maxwidth = 50,
            ellipsis_char = '...',
            menu = {
              nvim_lsp = '[LSP]',
              luasnip = '[Snip]',
              buffer = '[Buf]',
              path = '[Path]',
            },
          }),
        },
        experimental = {
          ghost_text = true, -- Cursor-like ghost text preview
        },
      })

      -- Cmdline completion
      cmp.setup.cmdline(':', {
        mapping = cmp.mapping.preset.cmdline(),
        sources = cmp.config.sources(
          { { name = 'path' } },
          { { name = 'cmdline' } }
        ),
      })
      cmp.setup.cmdline('/', {
        mapping = cmp.mapping.preset.cmdline(),
        sources = { { name = 'buffer' } },
      })
    end,
  },

  -- ---------------------------------------------------------------------------
  -- Git Signs (Gutter indicators) — Cursor's Git decorations
  -- ---------------------------------------------------------------------------
  {
    'lewis6991/gitsigns.nvim',
    event = { 'BufReadPre', 'BufNewFile' },
    config = function()
      require('gitsigns').setup({
        signs = {
          add          = { text = '▎' },
          change       = { text = '▎' },
          delete       = { text = '▁' },
          topdelete    = { text = '▔' },
          changedelete = { text = '▎' },
          untracked    = { text = '▎' },
        },
        current_line_blame = true, -- Show git blame inline (like Cursor)
        current_line_blame_opts = {
          virt_text = true,
          virt_text_pos = 'eol',
          delay = 500,
        },
        current_line_blame_formatter = '   <author>, <author_time:%Y-%m-%d> • <summary>',
        on_attach = function(bufnr)
          local gs = package.loaded.gitsigns
          local opts = { buffer = bufnr, noremap = true, silent = true }

          -- Navigation between hunks
          vim.keymap.set('n', ']c', function()
            if vim.wo.diff then return ']c' end
            vim.schedule(function() gs.next_hunk() end)
            return '<Ignore>'
          end, vim.tbl_extend('force', opts, { expr = true, desc = 'Next Hunk' }))

          vim.keymap.set('n', '[c', function()
            if vim.wo.diff then return '[c' end
            vim.schedule(function() gs.prev_hunk() end)
            return '<Ignore>'
          end, vim.tbl_extend('force', opts, { expr = true, desc = 'Previous Hunk' }))

          -- Actions
          vim.keymap.set('n', '<leader>hs', gs.stage_hunk, vim.tbl_extend('force', opts, { desc = 'Stage Hunk' }))
          vim.keymap.set('n', '<leader>hr', gs.reset_hunk, vim.tbl_extend('force', opts, { desc = 'Reset Hunk' }))
          vim.keymap.set('n', '<leader>hS', gs.stage_buffer, vim.tbl_extend('force', opts, { desc = 'Stage Buffer' }))
          vim.keymap.set('n', '<leader>hu', gs.undo_stage_hunk, vim.tbl_extend('force', opts, { desc = 'Undo Stage Hunk' }))
          vim.keymap.set('n', '<leader>hR', gs.reset_buffer, vim.tbl_extend('force', opts, { desc = 'Reset Buffer' }))
          vim.keymap.set('n', '<leader>hp', gs.preview_hunk, vim.tbl_extend('force', opts, { desc = 'Preview Hunk' }))
          vim.keymap.set('n', '<leader>hb', function() gs.blame_line({ full = true }) end, vim.tbl_extend('force', opts, { desc = 'Blame Line (Full)' }))
          vim.keymap.set('n', '<leader>hd', gs.diffthis, vim.tbl_extend('force', opts, { desc = 'Diff This' }))
        end,
      })
    end,
  },

  -- ---------------------------------------------------------------------------
  -- LazyGit (Full Git UI) — Cursor's Git panel
  -- ---------------------------------------------------------------------------
  {
    'kdheepak/lazygit.nvim',
    cmd = { 'LazyGit', 'LazyGitConfig', 'LazyGitCurrentFile' },
    dependencies = { 'nvim-lua/plenary.nvim' },
    keys = {
      { '<leader>gg', '<cmd>LazyGit<cr>', desc = 'LazyGit' },
      { '<leader>gf', '<cmd>LazyGitCurrentFile<cr>', desc = 'LazyGit Current File' },
    },
  },

  -- ---------------------------------------------------------------------------
  -- File Tree (nvim-tree) — Cursor's sidebar
  -- ---------------------------------------------------------------------------
  {
    'nvim-tree/nvim-tree.lua',
    dependencies = { 'nvim-tree/nvim-web-devicons' },
    config = function()
      local nvimtree = require('nvim-tree')

      local function on_attach(bufnr)
        local api = require('nvim-tree.api')
        local opts = { buffer = bufnr, noremap = true, silent = true, nowait = true }

        -- Default mappings
        api.config.mappings.default_on_attach(bufnr)

        -- Custom overrides
        vim.keymap.set('n', '<C-e>', api.tree.toggle, opts)
        vim.keymap.set('n', 'l', api.node.open.edit, vim.tbl_extend('force', opts, { desc = 'Open' }))
        vim.keymap.set('n', 'h', api.node.navigate.parent_close, vim.tbl_extend('force', opts, { desc = 'Close Directory' }))
        vim.keymap.set('n', 'v', api.node.open.vertical, vim.tbl_extend('force', opts, { desc = 'Open Vertical' }))
      end

      nvimtree.setup({
        on_attach = on_attach,
        view = {
          width = 35,
          side = 'left',
        },
        renderer = {
          root_folder_label = ':t', -- Show only directory name
          indent_markers = { enable = true },
          icons = {
            glyphs = {
              folder = {
                arrow_closed = '',
                arrow_open = '',
              },
              git = {
                unstaged = '✗',
                staged = '✓',
                unmerged = '',
                renamed = '➜',
                untracked = '★',
                deleted = '',
                ignored = '◌',
              },
            },
          },
        },
        update_focused_file = {
          enable = true, -- Auto-highlight current file in tree
          update_root = false,
        },
        diagnostics = {
          enable = true, -- Show LSP diagnostics in tree
          show_on_dirs = true,
          icons = {
            hint = '󰌵',
            info = '',
            warning = '',
            error = '',
          },
        },
        filters = {
          dotfiles = false,
          custom = { '.DS_Store' },
        },
        git = {
          enable = true,
          ignore = false,
        },
        actions = {
          open_file = {
            quit_on_open = false,
            resize_window = true,
          },
        },
      })

      -- Global keymap for toggle
      vim.keymap.set('n', '<C-e>', ':NvimTreeToggle<CR>', {
        desc = 'Toggle File Tree (Ctrl+E)',
        silent = true,
      })
    end,
  },

  -- ---------------------------------------------------------------------------
  -- Bufferline (Tab-like buffer bar) — Cursor's tab bar
  -- ---------------------------------------------------------------------------
  {
    'akinsho/bufferline.nvim',
    dependencies = { 'nvim-tree/nvim-web-devicons' },
    config = function()
      require('bufferline').setup({
        options = {
          mode = 'buffers',
          style_preset = require('bufferline').style_preset.default,
          separator_style = 'slant',
          show_buffer_close_icons = true,
          show_close_icon = false,
          color_icons = true,
          -- Enable mouse hover and click interactions
          hover = {
            enabled = true,
            delay = 200,
            reveal = { 'close' },
          },
          -- Ensure clicks work for switching / closing
          left_mouse_command = 'buffer %d',
          middle_mouse_command = 'bdelete! %d',
          right_mouse_command = 'bdelete! %d',
          close_command = 'bdelete! %d',
          diagnostics = 'nvim_lsp',
          diagnostics_indicator = function(count, level)
            local icon = level:match('error') and ' ' or ' '
            return ' ' .. icon .. count
          end,
          offsets = {
            {
              filetype = 'NvimTree',
              text = ' Explorer',
              text_align = 'left',
              separator = true,
            },
          },
        },
      })

      -- Buffer navigation keymaps (Cursor-like tab switching)
      vim.keymap.set('n', '<S-l>', ':BufferLineCycleNext<CR>', { desc = 'Next Buffer', silent = true })
      vim.keymap.set('n', '<S-h>', ':BufferLineCyclePrev<CR>', { desc = 'Previous Buffer', silent = true })
      vim.keymap.set('n', '<leader>bp', ':BufferLineTogglePin<CR>', { desc = 'Pin Buffer', silent = true })
      vim.keymap.set('n', '<leader>bx', ':BufferLinePickClose<CR>', { desc = 'Pick Buffer to Close', silent = true })
      vim.keymap.set('n', '<leader>bo', ':BufferLineCloseOthers<CR>', { desc = 'Close Other Buffers', silent = true })
    end,
  },

  -- ---------------------------------------------------------------------------
  -- Status Line (Lualine) — Enhanced status bar
  -- ---------------------------------------------------------------------------
  {
    'nvim-lualine/lualine.nvim',
    dependencies = { 'nvim-tree/nvim-web-devicons' },
    config = function()
      require('lualine').setup({
        options = {
          theme = 'tokyonight',
          icons_enabled = true,
          component_separators = { left = '', right = '' },
          section_separators = { left = '', right = '' },
          globalstatus = true, -- Single statusline even with splits
        },
        sections = {
          lualine_a = { 'mode' },
          lualine_b = { 'branch', 'diff', 'diagnostics' },
          lualine_c = {
            { 'filename', path = 1 }, -- Show relative path
          },
          lualine_x = { 'encoding', 'fileformat', 'filetype' },
          lualine_y = { 'progress' },
          lualine_z = { 'location' },
        },
      })
    end,
  },

  -- ---------------------------------------------------------------------------
  -- Integrated Terminal (ToggleTerm) — Cursor's terminal panel
  -- ---------------------------------------------------------------------------
  {
    'akinsho/toggleterm.nvim',
    config = function()
      require('toggleterm').setup({
        size = function(term)
          if term.direction == 'horizontal' then
            return 15
          elseif term.direction == 'vertical' then
            return vim.o.columns * 0.4
          end
        end,
        open_mapping = [[<C-\>]],
        direction = 'horizontal', -- Bottom panel like Cursor
        shade_terminals = true,
        shading_factor = 2,
        float_opts = {
          border = 'rounded',
          winblend = 0,
        },
      })

      -- Terminal mode keymaps
      function _G.set_terminal_keymaps()
        local opts = { buffer = 0, noremap = true, silent = true }
        vim.keymap.set('t', '<Esc>', [[<C-\><C-n>]], opts)
        vim.keymap.set('t', '<C-h>', [[<C-\><C-n><C-w>h]], opts)
        vim.keymap.set('t', '<C-j>', [[<C-\><C-n><C-w>j]], opts)
        vim.keymap.set('t', '<C-k>', [[<C-\><C-n><C-w>k]], opts)
        vim.keymap.set('t', '<C-l>', [[<C-\><C-n><C-w>l]], opts)
      end
      vim.cmd('autocmd! TermOpen term://* lua set_terminal_keymaps()')

      -- Leader+t for terminal toggle
      vim.keymap.set('n', '<leader>t', ':ToggleTerm<CR>', { desc = 'Toggle Terminal', silent = true })
      vim.keymap.set('n', '<leader>tf', ':ToggleTerm direction=float<CR>', { desc = 'Float Terminal', silent = true })
      vim.keymap.set('n', '<leader>tv', ':ToggleTerm direction=vertical<CR>', { desc = 'Vertical Terminal', silent = true })
    end,
  },

  -- ---------------------------------------------------------------------------
  -- Indent Guides (indent-blankline)
  -- ---------------------------------------------------------------------------
  {
    'lukas-reineke/indent-blankline.nvim',
    main = 'ibl',
    event = { 'BufReadPre', 'BufNewFile' },
    config = function()
      require('ibl').setup({
        indent = {
          char = '│',
          tab_char = '│',
        },
        scope = {
          enabled = true,
          show_start = true,
          show_end = false,
        },
        exclude = {
          filetypes = {
            'help', 'alpha', 'dashboard', 'NvimTree',
            'Trouble', 'lazy', 'mason', 'toggleterm',
          },
        },
      })
    end,
  },

  -- ---------------------------------------------------------------------------
  -- Auto Pairs (auto-close brackets)
  -- ---------------------------------------------------------------------------
  {
    'windwp/nvim-autopairs',
    event = 'InsertEnter',
    config = function()
      local autopairs = require('nvim-autopairs')
      autopairs.setup({
        check_ts = true, -- Use treesitter
        ts_config = {
          lua = { 'string', 'source' },
          javascript = { 'string', 'template_string' },
        },
      })
      -- Integrate with nvim-cmp
      local cmp_autopairs = require('nvim-autopairs.completion.cmp')
      local cmp = require('cmp')
      cmp.event:on('confirm_done', cmp_autopairs.on_confirm_done())
    end,
  },

  -- ---------------------------------------------------------------------------
  -- Comment.nvim (Toggle comments) — Cursor's Cmd+/
  -- ---------------------------------------------------------------------------
  {
    'numToStr/Comment.nvim',
    event = { 'BufReadPre', 'BufNewFile' },
    dependencies = { 'JoosepAlviste/nvim-ts-context-commentstring', 'nvim-treesitter/nvim-treesitter' },
    config = function()
      require('Comment').setup({
        -- TSX/JSX aware commenting
        pre_hook = function(ctx)
          -- Use ts_context_commentstring for JSX/TSX
          local ok, utils = pcall(require, 'ts_context_commentstring.utils')
          if ok then
            local internal_ok, internal = pcall(require, 'ts_context_commentstring.internal')
            if internal_ok then
              local location = nil
              if ctx.ctype == require('Comment.utils').ctype.blockcomment then
                location = utils.get_cursor_location()
              elseif ctx.cmotion == require('Comment.utils').cmotion.v or ctx.cmotion == require('Comment.utils').cmotion.V then
                location = utils.get_visual_start_location()
              end
              return internal.calculate_commentstring({
                key = ctx.ctype == require('Comment.utils').ctype.linewise and '__default' or '__multiline',
                location = location,
              })
            end
          end
        end,
      })
    end,
  },

  -- ---------------------------------------------------------------------------
  -- Which-Key (Keybinding discovery) — Shows available keybinds
  -- ---------------------------------------------------------------------------
  {
    'folke/which-key.nvim',
    event = 'VeryLazy',
    config = function()
      local wk = require('which-key')
      wk.setup({
        win = {
          border = 'rounded',
        },
        layout = {
          align = 'center',
        },
      })
      -- Register key groups
      wk.add({
        { '<leader>f', group = 'Find' },
        { '<leader>g', group = 'Git' },
        { '<leader>h', group = 'Git Hunk' },
        { '<leader>b', group = 'Buffer' },
        { '<leader>c', group = 'Code' },
        { '<leader>t', group = 'Terminal' },
      })
    end,
  },

  -- ---------------------------------------------------------------------------
  -- Alpha (Dashboard) — Startup screen
  -- ---------------------------------------------------------------------------
  {
    'goolord/alpha-nvim',
    event = 'VimEnter',
    dependencies = { 'nvim-tree/nvim-web-devicons' },
    config = function()
      local alpha = require('alpha')
      local dashboard = require('alpha.themes.dashboard')

      dashboard.section.header.val = {
        '                                                     ',
        '  ███╗   ██╗███████╗ ██████╗ ██╗   ██╗██╗███╗   ███╗',
        '  ████╗  ██║██╔════╝██╔═══██╗██║   ██║██║████╗ ████║',
        '  ██╔██╗ ██║█████╗  ██║   ██║██║   ██║██║██╔████╔██║',
        '  ██║╚██╗██║██╔══╝  ██║   ██║╚██╗ ██╔╝██║██║╚██╔╝██║',
        '  ██║ ╚████║███████╗╚██████╔╝ ╚████╔╝ ██║██║ ╚═╝ ██║',
        '  ╚═╝  ╚═══╝╚══════╝ ╚═════╝   ╚═══╝  ╚═╝╚═╝     ╚═╝',
        '                                                     ',
      }

      dashboard.section.buttons.val = {
        dashboard.button('f', '  Find File', ':Telescope find_files<CR>'),
        dashboard.button('r', '  Recent Files', ':Telescope oldfiles<CR>'),
        dashboard.button('g', '  Find Text', ':Telescope live_grep<CR>'),
        dashboard.button('c', '  Configuration', ':e ~/.config/nvim/init.lua<CR>'),
        dashboard.button('l', '󰒲  Lazy (Plugins)', ':Lazy<CR>'),
        dashboard.button('m', '  Mason (LSP)', ':Mason<CR>'),
        dashboard.button('q', '  Quit', ':qa<CR>'),
      }

      dashboard.section.footer.val = '🚀 Neovim — Cursor-like IDE'

      dashboard.config.layout = {
        { type = 'padding', val = 4 },
        dashboard.section.header,
        { type = 'padding', val = 2 },
        dashboard.section.buttons,
        { type = 'padding', val = 2 },
        dashboard.section.footer,
      }

      alpha.setup(dashboard.config)

      -- Disable folding on alpha buffer
      vim.cmd([[autocmd FileType alpha setlocal nofoldenable]])
    end,
  },

  -- ---------------------------------------------------------------------------
  -- Noice (Better UI for messages, cmdline, popups)
  -- ---------------------------------------------------------------------------
  {
    'folke/noice.nvim',
    event = 'VeryLazy',
    dependencies = {
      'MunifTanjim/nui.nvim',
      'rcarriga/nvim-notify',
    },
    config = function()
      require('noice').setup({
        lsp = {
          override = {
            ['vim.lsp.util.convert_input_to_markdown_lines'] = true,
            ['vim.lsp.util.stylize_markdown'] = true,
            ['cmp.entry.get_documentation'] = true,
          },
        },
        presets = {
          bottom_search = true,
          command_palette = true,
          long_message_to_split = true,
          inc_rename = false,
          lsp_doc_border = true,
        },
      })
    end,
  },

  -- ---------------------------------------------------------------------------
  -- Todo Comments (Highlight TODO, FIXME, etc.)
  -- ---------------------------------------------------------------------------
  {
    'folke/todo-comments.nvim',
    event = { 'BufReadPre', 'BufNewFile' },
    dependencies = { 'nvim-lua/plenary.nvim' },
    config = function()
      require('todo-comments').setup()
      vim.keymap.set('n', '<leader>ft', ':TodoTelescope<CR>', { desc = 'Find TODOs', silent = true })
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
  -- Checker for plugin updates
  checker = {
    enabled = true,
    notify = false,
  },
})

-- =============================================================================
-- 4. GENERAL KEYMAPS
-- =============================================================================

-- Window navigation (Ctrl+hjkl)
vim.keymap.set('n', '<C-h>', '<C-w>h', { desc = 'Move to Left Window' })
vim.keymap.set('n', '<C-j>', '<C-w>j', { desc = 'Move to Bottom Window' })
vim.keymap.set('n', '<C-k>', '<C-w>k', { desc = 'Move to Top Window' })
vim.keymap.set('n', '<C-l>', '<C-w>l', { desc = 'Move to Right Window' })

-- Resize windows with arrows
vim.keymap.set('n', '<C-Up>', ':resize +2<CR>', { desc = 'Increase Window Height', silent = true })
vim.keymap.set('n', '<C-Down>', ':resize -2<CR>', { desc = 'Decrease Window Height', silent = true })
vim.keymap.set('n', '<C-Left>', ':vertical resize -2<CR>', { desc = 'Decrease Window Width', silent = true })
vim.keymap.set('n', '<C-Right>', ':vertical resize +2<CR>', { desc = 'Increase Window Width', silent = true })

-- Move lines up/down (Alt+j/k) — like Cursor's Alt+Up/Down
vim.keymap.set('n', '<A-j>', ':m .+1<CR>==', { desc = 'Move Line Down', silent = true })
vim.keymap.set('n', '<A-k>', ':m .-2<CR>==', { desc = 'Move Line Up', silent = true })
vim.keymap.set('v', '<A-j>', ":m '>+1<CR>gv=gv", { desc = 'Move Selection Down', silent = true })
vim.keymap.set('v', '<A-k>', ":m '<-2<CR>gv=gv", { desc = 'Move Selection Up', silent = true })

-- Better indenting in visual mode
vim.keymap.set('v', '<', '<gv', { desc = 'Indent Left' })
vim.keymap.set('v', '>', '>gv', { desc = 'Indent Right' })

-- Clear search highlight with Escape
vim.keymap.set('n', '<Esc>', ':nohlsearch<CR>', { desc = 'Clear Search Highlight', silent = true })

-- Close buffer
vim.keymap.set('n', '<leader>x', ':bdelete<CR>', { desc = 'Close Buffer', silent = true })

-- Save file
vim.keymap.set('n', '<C-s>', ':w<CR>', { desc = 'Save File', silent = true })
vim.keymap.set('i', '<C-s>', '<Esc>:w<CR>', { desc = 'Save File', silent = true })

-- Select all
vim.keymap.set('n', '<C-a>', 'ggVG', { desc = 'Select All' })
