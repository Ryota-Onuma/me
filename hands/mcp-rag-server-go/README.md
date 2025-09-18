# MCP RAG Server (Go)

MCP準拠のRAG機能を持つGoサーバー。軽量・高速・シンプル。

## クイックスタート

```bash
# DB起動
make db-up

# ドキュメント索引
make index

# 検索
make search QUERY="検索クエリ"

# サーバー起動
make run-server
```

## アーキテクチャ

- **PostgreSQL + pgvector**: Dockerで起動
- **Goアプリ**: ホストで直接実行
- **MCP**: JSON-RPC over stdio
- **埋め込み**: モック実装（本番では外部API）

## コマンド

```bash
make build      # ビルド
make db-up      # PostgreSQL起動
make index      # ドキュメント索引
make count      # ドキュメント数
make clear      # 全削除
make search QUERY="..." # 検索
make run-server # サーバー起動
```

## 設定

`.env`ファイルで設定。PostgreSQLはDockerで自動起動。