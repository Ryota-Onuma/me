# MCP RAG Server

MCP RAG Serverは、Model Context Protocol (MCP)に準拠したRAG（Retrieval-Augmented Generation）機能を持つPythonサーバーです。マークダウン、テキスト、PowerPoint、PDFなど複数の形式のドキュメントをデータソースとして、multilingual-e5-largeモデルを使用してインデックス化し、ベクトル検索によって関連情報を取得する機能を提供します。

## 概要

このプロジェクトは、MCPサーバーの基本的な実装に加えて、RAG機能を提供します。複数形式のドキュメントをインデックス化し、自然言語クエリに基づいて関連情報を検索することができます。

## 機能

- **MCPサーバーの基本実装**
  - JSON-RPC over stdioベースで動作
  - ツールの登録と実行のためのメカニズム
  - エラーハンドリングとロギング

- **RAG機能**
  - 複数形式のドキュメント（マークダウン、テキスト、PowerPoint、PDF）の読み込みと解析
  - 階層構造を持つソースディレクトリに対応
  - markitdownライブラリを使用したPowerPointやPDFからのマークダウン変換
  - 選択可能なエンベディングモデル（multilingual-e5-large、ruriなど）を使用したエンベディング生成
  - PostgreSQLのpgvectorを使用したベクトルデータベース
  - ベクトル検索による関連情報の取得
  - 前後のチャンク取得機能（コンテキストの連続性を確保）
  - ドキュメント全文取得機能（完全なコンテキストを提供）
  - 差分インデックス化機能（新規・変更ファイルのみを処理）

- **ツール**
  - ベクトル検索ツール（MCP）
  - ドキュメント数取得ツール（MCP）
  - インデックス管理ツール（CLI）

## 前提条件

- Docker
- Docker Compose

## 🐳 Docker を使用したセットアップ（推奨）

### 1. リポジトリのクローン

```bash
git clone <repository-url>
cd mcp-rag-server
```

### 2. ドキュメントの配置

検索対象のドキュメントを `data/source/` ディレクトリに配置します：

```bash
mkdir -p data/source
# ドキュメントファイル（PDF, DOCX, MD等）を data/source/ にコピー
```

### 3. Docker Compose でサービスを起動

```bash
# バックグラウンドでサービスを起動
docker-compose up -d

# ログを確認
docker-compose logs -f mcp-server
```

### 4. ドキュメントのインデックス作成

```bash
# ドキュメントを初期インデックス
docker compose exec mcp-server uv run python -m src.cli --project alpha index

# 差分インデックス（追加/更新されたファイルのみ）
docker compose exec mcp-server uv run python -m src.cli --project alpha index --incremental

# インデックスされたドキュメント数の確認
docker compose exec mcp-server uv run python -m src.cli --project alpha count

# インデックスのクリア
docker compose exec mcp-server uv run python -m src.cli --project alpha clear
```

## MCP クライアントからの接続

### Claude Code での設定

MCP RAG Server に Claude Code から接続するには、以下の設定をClaude Codeの設定に追加します：

```json
{
  "mcpServers": {
    "mcp-rag-server": {
      "command": "docker",
      "args": [
        "compose",
        "exec",
        "-T",
        "mcp-server",
        "uv",
        "run",
        "python",
        "-m",
        "src.main",
        "--project",
        "alpha"
      ],
      "env": {
        "POSTGRES_HOST": "postgres",
        "POSTGRES_PORT": "5432", 
        "POSTGRES_USER": "postgres",
        "POSTGRES_PASSWORD": "password",
        "POSTGRES_DB": "ragdb"
      }
    }
  }
}
```

### 他のMCPクライアントでの設定

他のMCPクライアントでも、上記と同様の設定で接続できます。基本的には：

1. `command`: `docker`
2. `args`: `["compose", "exec", "-T", "mcp-server", "uv", "run", "python", "-m", "src.main", "--project", "alpha"]`

## カスタマイズ

### エンベディングモデルの設定

`docker-compose.yml` の `environment` セクションを変更することで、エンベディングモデルをカスタマイズできます：

#### サポートされているモデル

**multilingual-e5-large（デフォルト）**
```yaml
environment:
  EMBEDDING_MODEL: intfloat/multilingual-e5-large
  EMBEDDING_DIM: 1024
  EMBEDDING_PREFIX_QUERY: "query: "
  EMBEDDING_PREFIX_EMBEDDING: "passage: "
```

**cl-nagoya/ruri-v3-30m**
```yaml
environment:
  EMBEDDING_MODEL: cl-nagoya/ruri-v3-30m
  EMBEDDING_DIM: 256
  EMBEDDING_PREFIX_QUERY: "検索クエリ: "
  EMBEDDING_PREFIX_EMBEDDING: "検索文書: "
```

#### モデル変更時の注意

エンベディングモデルを変更した場合は、ベクトル次元が変わる可能性があるため、既存のインデックスをクリアして再作成してください：

```bash
docker compose exec mcp-server uv run python -m src.cli --project alpha clear
docker compose exec mcp-server uv run python -m src.cli --project alpha index
```

### ポート設定の変更

PostgreSQL のポートを変更する場合は、`docker-compose.yml` を編集します：

```yaml
postgres:
  ports:
    - "5433:5432"  # ホスト側のポートを5433に変更
```

## トラブルシューティング

### サービスが起動しない場合

```bash
# サービスのステータス確認
docker-compose ps

# ログの確認
docker-compose logs postgres
docker-compose logs mcp-server

# サービスの再起動
docker-compose restart
```

### データベース接続エラーの場合

```bash
# PostgreSQL コンテナの状態確認
docker compose exec postgres pg_isready -U postgres -d ragdb

# データベースに直接接続
docker compose exec postgres psql -U postgres -d ragdb
```

### インデックス作成エラーの場合

```bash
# コンテナ内でログを確認
docker compose exec mcp-server cat logs/mcp_rag_server.log

# インデックスのクリア
docker compose exec mcp-server uv run python -m src.cli --project alpha clear
```

## サービスの停止

```bash
# サービスを停止（コンテナは残る）
docker-compose stop

# サービスを停止してコンテナを削除
docker-compose down

# ボリュームも含めて完全に削除
docker-compose down -v
```

## 利用可能なツール

MCP RAG Server は以下のツールを提供します：

### search

ベクトル検索を行います。

```json
{
  "jsonrpc": "2.0",
  "method": "search",
  "params": {
    "query": "Pythonのジェネレータとは何ですか？",
    "limit": 5,
    "with_context": true,
    "context_size": 1,
    "full_document": false
  },
  "id": 1
}
```

#### パラメータの説明

- `query`: 検索クエリ（必須）
- `limit`: 返す結果の数（デフォルト: 5）
- `with_context`: 前後のチャンクも取得するかどうか（デフォルト: true）
- `context_size`: 前後に取得するチャンク数（デフォルト: 1）
- `full_document`: ドキュメント全体を取得するかどうか（デフォルト: false）

#### 検索結果の機能

1. **前後のチャンク取得**: 検索でヒットしたチャンクの前後のチャンクも取得してコンテキストの連続性を確保
2. **ドキュメント全文取得**: 必要に応じてドキュメント全体を取得可能
3. **結果の整形**: ファイルごとにグループ化し、視覚的に区別された形で表示

### get_document_count

インデックス内のドキュメント数を取得します。

```json
{
  "jsonrpc": "2.0",
  "method": "get_document_count",
  "params": {},
  "id": 2
}
```

## バックアップと復元

### PostgreSQLデータベースのバックアップ

```bash
# Dockerコンテナ内でデータベースをバックアップ
docker compose exec postgres pg_dump -U postgres -d ragdb -F c -f /tmp/ragdb_backup.dump

# バックアップファイルをコンテナからホストにコピー
docker cp mcp-rag-postgres:/tmp/ragdb_backup.dump ./ragdb_backup.dump
```

### データベースの復元

```bash
# バックアップファイルをコンテナにコピー
docker cp ./ragdb_backup.dump mcp-rag-postgres:/tmp/ragdb_backup.dump

# コンテナ内でデータベースを復元
docker compose exec postgres pg_restore -U postgres -d ragdb -c /tmp/ragdb_backup.dump
```

## 対応ドキュメント形式

- Markdown (.md, .markdown)
- テキスト (.txt)
- PowerPoint (.ppt, .pptx)
- Word (.doc, .docx)
- PDF (.pdf)

---

## 📝 ローカル環境での開発（開発者向け）

Docker を使用せずにローカル環境で開発する場合の手順です。

### 前提条件

- Python 3.10以上
- PostgreSQL 14以上（pgvectorエクステンション付き）

### PostgreSQLとpgvectorのセットアップ

#### Dockerを使用する場合

```bash
# pgvectorを含むPostgreSQLコンテナを起動
docker run --name postgres-pgvector -e POSTGRES_PASSWORD=password -p 5432:5432 -d pgvector/pgvector:pg17

# ragdbデータベースの作成
docker exec -it postgres-pgvector psql -U postgres -c "CREATE DATABASE ragdb;"
```

#### 既存のPostgreSQLにpgvectorをインストールする場合

```sql
-- pgvectorエクステンションをインストール
CREATE EXTENSION vector;
```

### 依存関係のインストール

```bash
# uvがインストールされていない場合は先にインストール
# pip install uv

# 依存関係のインストール
uv sync
```

### 環境変数の設定

`.env`ファイルを作成し、ローカル環境用の設定をします：

```bash
# .env.sample をコピーして .env ファイルを作成
cp .env.sample .env

# 必要に応じて .env ファイルを編集
```

### MCPサーバーの起動

```bash
# uvを使用する場合（推奨）
uv run python -m src.main --project alpha

# オプションを指定する場合
uv run python -m src.main --project alpha --name "my-rag-server" --version "1.0.0"
```

### コマンドラインツール（CLI）の使用方法

```bash
# インデックスのクリア
uv run python -m src.cli --project alpha clear

# ドキュメントのインデックス化
uv run python -m src.cli --project alpha index

# 差分インデックス化
uv run python -m src.cli --project alpha index --incremental

# インデックス内のドキュメント数の取得
uv run python -m src.cli --project alpha count
```

### MCPホストでの設定（ローカル開発）

ローカル環境でのMCPクライアント設定：

```json
{
  "mcpServers": {
    "mcp-rag-server": {
      "command": "uv",
      "args": [
        "run",
        "--directory",
        "/path/to/mcp-rag-server",
        "python",
        "-m",
        "src.main",
        "--project",
        "alpha"
      ]
    }
  }
}
```

---

## ディレクトリ構造

```
mcp-rag-server/
├── data/
│   ├── source/        # 原稿ファイル（階層構造対応）
│   │   ├── markdown/  # マークダウンファイル
│   │   ├── docs/      # ドキュメントファイル
│   │   └── slides/    # プレゼンテーションファイル
│   └── processed/     # 処理済みファイル（テキスト抽出済み）
│       └── file_registry.json  # 処理済みファイルの情報（差分インデックス用）
├── docs/
│   └── design.md      # 設計書
├── logs/              # ログファイル（ENABLE_FILE_LOGGING=true時のみ）
├── src/
│   ├── __init__.py
│   ├── document_processor.py  # ドキュメント処理モジュール
│   ├── embedding_generator.py # エンベディング生成モジュール
│   ├── example_tool.py        # サンプルツールモジュール
│   ├── main.py                # メインエントリーポイント
│   ├── mcp_server.py          # MCPサーバーモジュール
│   ├── rag_service.py         # RAGサービスモジュール
│   ├── rag_tools.py           # RAGツールモジュール
│   └── vector_database.py     # ベクトルデータベースモジュール
├── tests/
├── .env.docker        # Docker環境用環境変数
├── .env.sample        # ローカル環境用サンプル設定
├── .gitignore
├── CLAUDE.md          # Claude Code用設定
├── Dockerfile
├── docker-compose.yml
├── LICENSE
├── pyproject.toml
└── README.md
```

## ライセンス

このプロジェクトはMITライセンスの下で公開されています。詳細は[LICENSE](LICENSE)ファイルを参照してください。
