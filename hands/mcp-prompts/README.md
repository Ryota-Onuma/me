# MCP Prompts / MCPプロンプト

[English](#english) | [日本語](#japanese)

## English

A unified MCP (Model Context Protocol) server for custom prompts across **Claude Code**, **Cursor**, and **Codex CLI**.

This server enables you to manage a single set of Markdown prompts with frontmatter that work seamlessly across multiple AI coding assistants, with client-specific optimizations and frontmatter handling.

## Japanese

**Claude Code**、**Cursor**、**Codex CLI**に対応した統一MCPサーバーです。

フロントマター付きMarkdownプロンプトを単一セットで管理し、複数のAIコーディングアシスタント間でシームレスに動作。クライアント固有の最適化とフロントマター処理を提供します。

## Features / 特徴

### English
- 🔄 **Universal Compatibility**: Single prompt files work across Claude Code, Cursor, and Codex CLI
- 📝 **Frontmatter Support**: Claude-compatible YAML/TOML frontmatter with client-specific handling
- 🎯 **Template Engine**: Positional (`$1`, `$2`) and named (`{{name}}`) argument substitution
- 🎨 **Client Optimization**: Automatic optimization for each client's capabilities
- 🔥 **Hot Reload**: Real-time file watching for development
- 🏷️ **Rich Metadata**: Tags, aliases, version tracking, and search
- 🔒 **Security**: Path validation and sandboxed file access
- ⚡ **Performance**: Intelligent caching and fast file scanning
- 📊 **Observability**: Structured JSON logging

### 日本語
- 🔄 **汎用互換性**: Claude Code、Cursor、Codex CLIで共通のプロンプトファイルを使用
- 📝 **フロントマターサポート**: Claude互換のYAML/TOMLフロントマターとクライアント固有処理
- 🎯 **テンプレートエンジン**: 位置指定（`$1`, `$2`）と名前指定（`{{name}}`）の引数置換
- 🎨 **クライアント最適化**: 各クライアントの機能に応じた自動最適化
- 🔥 **ホットリロード**: 開発時のリアルタイムファイル監視
- 🏷️ **リッチメタデータ**: タグ、エイリアス、バージョン管理、検索機能
- 🔒 **セキュリティ**: パス検証とサンドボックス化されたファイルアクセス
- ⚡ **パフォーマンス**: 高速ファイルスキャンとインテリジェントキャッシュ
- 📊 **可観測性**: 構造化JSONログ

## Quick Start / クイックスタート

### English

#### Installation

```bash
npm install -g mcp-prompts
```

#### Basic Usage

1. **Create your prompts directory:**

```bash
mkdir -p ~/prompt-registry/commands
```

2. **Create a sample prompt:**

```markdown
---
model: claude-3-haiku
allowed-tools:
  - Bash(git status:*, git diff:*, git show:*)
argument-hint: "commit [scope] [priority]"
tags: ["git", "commit"]
version: 1
---
# Create a high-quality commit message

Please read the staged changes and write:
- Title (<= 50 chars)
- Body: What/Why/How, risks, test notes
- Bullet points for key changes

Scope: {{scope}}
Priority: $1
```

3. **Start the MCP server:**

```bash
mcp-prompts --client claude --watch
```

### 日本語

#### インストール

```bash
npm install -g mcp-prompts
```

#### 基本的な使い方

1. **プロンプト用ディレクトリの作成:**

```bash
mkdir -p ~/prompt-registry/commands
```

2. **サンプルプロンプトの作成:**

```markdown
---
model: claude-3-haiku
allowed-tools:
  - Bash(git status:*, git diff:*, git show:*)
argument-hint: "commit [scope] [priority]"
tags: ["git", "commit"]
version: 1
---
# 高品質なコミットメッセージを作成

ステージされた変更を読み、以下を作成してください:
- タイトル (50文字以内)
- 本文: 何を/なぜ/どのように、リスク、テスト注意事項
- 主要な変更の箇条書き

スコープ: {{scope}}
優先度: $1
```

3. **MCPサーバーの起動:**

```bash
mcp-prompts --client claude --watch
```

## Client Integration / クライアント統合

### English

#### Claude Code

MCP prompts automatically appear as slash commands:

```bash
# Configuration (automatic with Claude Code MCP discovery)
# Prompts appear as: /mcp__prompts__<prompt-name>
```

#### Cursor

Add to `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "prompts": {
      "command": "npx",
      "args": ["-y", "mcp-prompts", "--client", "cursor"],
      "env": {
        "PROMPTS_DIR": "~/prompt-registry/commands"
      }
    }
  }
}
```

#### Codex CLI

Add to `~/.codex/config.toml`:

```toml
[mcp_servers.prompts]
command = "npx"
args = ["-y", "mcp-prompts", "--client", "codex"]
env = { PROMPTS_DIR = "~/prompt-registry/commands" }
```

### 日本語

#### Claude Code

MCPプロンプトは自動的にスラッシュコマンドとして表示されます:

```bash
# 設定（Claude CodeのMCP自動検出機能）
# プロンプトは /mcp__prompts__<prompt-name> として表示されます
```

#### Cursor

`~/.cursor/mcp.json` に追加:

```json
{
  "mcpServers": {
    "prompts": {
      "command": "npx",
      "args": ["-y", "mcp-prompts", "--client", "cursor"],
      "env": {
        "PROMPTS_DIR": "~/prompt-registry/commands"
      }
    }
  }
}
```

#### Codex CLI

`~/.codex/config.toml` に追加:

```toml
[mcp_servers.prompts]
command = "npx"
args = ["-y", "mcp-prompts", "--client", "codex"]
env = { PROMPTS_DIR = "~/prompt-registry/commands" }
```

## Detailed MCP Configuration Examples / 詳細なMCP設定例

### English

#### Claude Code with Custom Settings

For Claude Code, you can customize the MCP server behavior with additional environment variables:

```json
{
  "mcpServers": {
    "mcp-prompts": {
      "command": "npx",
      "args": ["-y", "mcp-prompts", "--client", "claude", "--watch", "--verbose"],
      "env": {
        "PROMPTS_DIR": "~/my-prompts",
        "LOG_LEVEL": "debug",
        "CLIENT": "claude"
      }
    }
  }
}
```

#### Cursor with Multiple Prompt Directories

```json
{
  "mcpServers": {
    "personal-prompts": {
      "command": "npx",
      "args": ["-y", "mcp-prompts", "--client", "cursor", "--flatten-paths"],
      "env": {
        "PROMPTS_DIR": "~/personal-prompts"
      }
    },
    "work-prompts": {
      "command": "npx",
      "args": ["-y", "mcp-prompts", "--client", "cursor", "--strict-args"],
      "env": {
        "PROMPTS_DIR": "~/work/prompts"
      }
    }
  }
}
```

#### Advanced Configuration with Local Installation

If you have mcp-prompts installed locally:

```json
{
  "mcpServers": {
    "prompts": {
      "command": "node",
      "args": ["/path/to/mcp-prompts/dist/index.js", "--client", "claude"],
      "env": {
        "PROMPTS_DIR": "/absolute/path/to/prompts",
        "LOG_LEVEL": "info",
        "NODE_ENV": "production"
      }
    }
  }
}
```

#### Development Setup with Hot Reload

```json
{
  "mcpServers": {
    "dev-prompts": {
      "command": "npx",
      "args": ["-y", "mcp-prompts", "--client", "claude", "--watch", "--verbose", "--no-cache"],
      "env": {
        "PROMPTS_DIR": "~/dev/prompts",
        "LOG_LEVEL": "debug"
      }
    }
  }
}
```

### 日本語

#### Claude Code カスタム設定

Claude Codeでは、追加の環境変数でMCPサーバーの動作をカスタマイズできます：

```json
{
  "mcpServers": {
    "mcp-prompts": {
      "command": "npx",
      "args": ["-y", "mcp-prompts", "--client", "claude", "--watch", "--verbose"],
      "env": {
        "PROMPTS_DIR": "~/my-prompts",
        "LOG_LEVEL": "debug",
        "CLIENT": "claude"
      }
    }
  }
}
```

#### Cursor 複数プロンプトディレクトリ設定

```json
{
  "mcpServers": {
    "personal-prompts": {
      "command": "npx",
      "args": ["-y", "mcp-prompts", "--client", "cursor", "--flatten-paths"],
      "env": {
        "PROMPTS_DIR": "~/personal-prompts"
      }
    },
    "work-prompts": {
      "command": "npx",
      "args": ["-y", "mcp-prompts", "--client", "cursor", "--strict-args"],
      "env": {
        "PROMPTS_DIR": "~/work/prompts"
      }
    }
  }
}
```

#### ローカルインストール時の高度な設定

mcp-promptsをローカルにインストールした場合：

```json
{
  "mcpServers": {
    "prompts": {
      "command": "node",
      "args": ["/path/to/mcp-prompts/dist/index.js", "--client", "claude"],
      "env": {
        "PROMPTS_DIR": "/absolute/path/to/prompts",
        "LOG_LEVEL": "info",
        "NODE_ENV": "production"
      }
    }
  }
}
```

#### 開発環境用ホットリロード設定

```json
{
  "mcpServers": {
    "dev-prompts": {
      "command": "npx",
      "args": ["-y", "mcp-prompts", "--client", "claude", "--watch", "--verbose", "--no-cache"],
      "env": {
        "PROMPTS_DIR": "~/dev/prompts",
        "LOG_LEVEL": "debug"
      }
    }
  }
}
```

## Command Line Options

```bash
mcp-prompts [options]

Options:
  --client, -c <type>       Target client (claude|cursor|codex|generic) [default: generic]
  --prompts-dir, -d <path>  Prompts directory [default: ~/prompt-registry/commands]
  --strict-args             Error on unresolved template placeholders
  --flatten-paths           Convert paths to names (path/to/file.md → path__to__file)
  --watch, -w               Enable file watching for hot reload
  --no-cache                Disable content caching
  --verbose, -v             Enable verbose logging
  --help                    Show help
  --version                 Show version
```

## Environment Variables

- `PROMPTS_DIR`: Directory containing prompt files
- `LOG_LEVEL`: Logging level (debug, info, warn, error)
- `CLIENT`: Default client type

## Prompt Format

### Frontmatter (Optional)

```yaml
---
# Claude-specific model selection
model: claude-3-haiku

# Tool permissions (Claude format)
allowed-tools:
  - Bash(git status:*, git diff:*)
  - Read(/path/to/files/*.md)

# Usage hint for argument completion
argument-hint: "command <required> [optional]"

# Tags for organization and search
tags: ["git", "automation", "commit"]

# Client targeting (if not specified, available to all)
targets: ["claude", "cursor", "codex"]

# Aliases for the prompt
aliases: ["c", "ci"]

# Version for tracking changes
version: 2
---
```

### Template Variables

#### Positional Arguments
```markdown
Hello $1, welcome to $2!
# Usage: prompt("Alice", "GitHub") → "Hello Alice, welcome to GitHub!"
```

#### Named Arguments
```markdown
User {{name}} has {{role}} access.
# Usage: prompt({name: "Alice", role: "admin"}) → "User Alice has admin access."
```

#### Escaping
```markdown
Literal: $$1 and {{{escaped}}}
# Output: "Literal: $1 and {{escaped}}"
```

## Client-Specific Behavior

| Feature | Claude | Cursor | Codex | Notes |
|---------|--------|--------|-------|-------|
| Frontmatter | ✅ Kept | ❌ Stripped | ❌ Stripped | Claude preserves for tool permissions |
| System Messages | ✅ Yes | ✅ Yes | ❌ No | Codex converts to user content |
| Template Args | ✅ Yes | ✅ Yes | ✅ Yes | All clients support templating |
| Hot Reload | ✅ Yes | ✅ Yes | ✅ Yes | Real-time prompt updates |

## Advanced Features

### Directory Structure

```
~/prompt-registry/commands/
├── git/
│   ├── commit.md
│   ├── review.md
│   └── release.md
├── docs/
│   └── readme.md
└── general/
    └── explain.md
```

### Flattened Paths

With `--flatten-paths`:
- `git/commit.md` → `git__commit`
- `docs/readme.md` → `docs__readme`

### Search and Filtering

```javascript
// List all prompts
await store.list();

// Filter by client
await store.list({ client: 'claude' });

// Search by name/tags
await store.list({ query: 'git' });

// Filter by tags
await store.list({ tags: ['git', 'commit'] });
```

## Performance

- **File Scanning**: ~200ms for 500+ files
- **Template Rendering**: <50ms (cached content)
- **Hot Reload**: Immediate reflection of changes
- **Memory Usage**: Intelligent caching with LRU eviction

## Security

- **Path Validation**: Prevents directory traversal attacks
- **Sandboxed Access**: Only reads from `PROMPTS_DIR`
- **No Network**: Zero external network requests
- **Sanitized Logging**: Sensitive content excluded from logs

## Troubleshooting

### Common Issues

1. **"Prompt not found"**
   - Check file exists in `PROMPTS_DIR`
   - Verify file has `.md` extension
   - Try `--verbose` for detailed logging

2. **"Invalid frontmatter"**
   - Validate YAML syntax
   - Check for required `---` delimiters
   - Review supported frontmatter fields

3. **"Unresolved template arguments"**
   - Use `--strict-args` to catch missing variables
   - Check argument names match template placeholders

4. **Performance issues**
   - Enable `--no-cache` to disable caching temporarily
   - Check for very large files or directories

### Debugging

```bash
# Enable verbose logging
LOG_LEVEL=debug mcp-prompts --verbose

# Test template rendering
mcp-prompts --client claude --strict-args

# Monitor file changes
mcp-prompts --watch --verbose
```

## Development

### Building from Source

```bash
git clone https://github.com/your-org/mcp-prompts.git
cd mcp-prompts
npm install
npm run build
npm test
```

### Project Structure

```
src/
├── index.ts          # CLI entry point
├── server.ts         # MCP server implementation
├── promptStore.ts    # File scanning and caching
├── frontmatter.ts    # YAML/TOML parsing
├── templating.ts     # Variable substitution
├── clientProfile.ts  # Client-specific handling
├── logger.ts         # Structured logging
├── errors.ts         # Error handling
└── types.ts          # TypeScript definitions
```

### Running Tests

```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # With coverage
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Support

- **Issues**: [GitHub Issues](https://github.com/your-org/mcp-prompts/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-org/mcp-prompts/discussions)
- **Documentation**: [Full Documentation](https://docs.mcp-prompts.dev)

---

**Note**: This project implements the Model Context Protocol (MCP) specification for prompts. For more information about MCP, visit [modelcontextprotocol.org](https://modelcontextprotocol.org).