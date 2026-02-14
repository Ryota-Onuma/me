---
name: github-review
description: GitHub PRにレビューコメント（Inline/Comment/Review）を投稿するCLIツールを提供します。エージェントがPRレビュー結果をGitHubに自動投稿する際に使用します。
user-invocable: false
---

# GitHub Review CLI スキル

## Purpose
GitHub PRに対してレビューコメントを投稿するためのCLIツール `github-review-cli` を提供するスキルです。
インラインコメント、PRコメント、レビュー（Approve/Request Changes/Comment）の3種類の投稿をサポートします。

ソースコードは `scripts/` ディレクトリに同梱されています。

## Prerequisites

> [!IMPORTANT]
> **事前に以下が必要です：**
> 1. Go 1.24 以上がインストール済みであること
> 2. `gh` CLI がインストール済みで認証済みであること（`gh auth login`）

## ビルドとツールパス

スキルディレクトリの `scripts/` 配下にGoソースコードが同梱されています。

```bash
# ビルド（スキルディレクトリ内で実行）
cd bag/claude/dev/skills/github-review/scripts && go build -o github-review-cli

# 実行
bag/claude/dev/skills/github-review/scripts/github-review-cli <command> [options]
```

ビルド済みバイナリのパス:
```
bag/claude/dev/skills/github-review/scripts/github-review-cli
```

## Available Commands

### 1. `inline` — インラインコメント

特定ファイルの特定行にコメントを作成する。

```bash
github-review-cli inline \
  --owner OWNER \
  --repo REPO \
  --pr NUMBER \
  --path FILE_PATH \
  --line LINE_NUMBER \
  --body "コメント本文"
```

| パラメータ | 必須 | 説明 |
|-----------|------|------|
| `--owner` | ✅ | リポジトリオーナー |
| `--repo` | ✅ | リポジトリ名 |
| `--pr` | ✅ | PR番号 |
| `--path` | ✅ | リポジトリルートからの相対ファイルパス |
| `--line` | ✅ | 行番号 |
| `--body` | ✅ | コメント本文 |
| `--side` | ❌ | `LEFT`（削除行）or `RIGHT`（追加行、デフォルト） |
| `--start-line` | ❌ | マルチラインコメントの開始行 |

### 2. `comment` — PRコメント

PRに対して一般的なコメントを作成する。

```bash
github-review-cli comment \
  --owner OWNER \
  --repo REPO \
  --pr NUMBER \
  --body "コメント本文"
```

| パラメータ | 必須 | 説明 |
|-----------|------|------|
| `--owner` | ✅ | リポジトリオーナー |
| `--repo` | ✅ | リポジトリ名 |
| `--pr` | ✅ | PR番号 |
| `--body` | ✅ | コメント本文 |

### 3. `review` — レビュー作成

PRに対してレビュー（Approve / Request Changes / Comment）を作成する。

```bash
github-review-cli review \
  --owner OWNER \
  --repo REPO \
  --pr NUMBER \
  --event EVENT \
  --body "レビュー本文"
```

| パラメータ | 必須 | 説明 |
|-----------|------|------|
| `--owner` | ✅ | リポジトリオーナー |
| `--repo` | ✅ | リポジトリ名 |
| `--pr` | ✅ | PR番号 |
| `--event` | ❌ | `APPROVE` / `REQUEST_CHANGES` / `COMMENT`（デフォルト: `COMMENT`） |
| `--body` | ❌ | レビュー本文 |

## Usage Guidelines

### コメントタイプの判定基準

| タイプ | いつ使うか |
|--------|-----------|
| **Inline** | 特定ファイル・行への指摘がある場合 |
| **Comment** | 質問・確認事項・ファイル横断的な軽いコメント |
| **Review** | 全体的な評価（最後に1回投稿） |

### Review Event の使い分け

| Event | 条件 |
|-------|------|
| `APPROVE` | クリティカルな問題なし |
| `REQUEST_CHANGES` | 修正必須の問題あり |
| `COMMENT` | 判断保留・コメントのみ |

### 投稿順序

1. **Inline Comments** を先に投稿（各ファイル・行への指摘）
2. **Comment** があれば投稿（質問・確認事項）
3. **Review** を最後に投稿（全体サマリー）

## ディレクトリ構成

```
github-review/
├── SKILL.md              (このファイル)
└── scripts/
    ├── main.go           (CLIエントリーポイント)
    ├── go.mod
    ├── go.sum
    ├── README.md
    ├── auth/
    │   ├── gh.go         (gh CLI 認証)
    │   └── gh_test.go
    └── github/
        ├── client.go     (GitHub API クライアント)
        └── client_test.go
```
