# GitHub Review Comment CLI

GitHub PRに対してレビューコメントを投稿するCLIツールです。

## 前提条件

- Go 1.21以上
- `gh` CLI がインストール済みで認証済み (`gh auth login`)

## インストール

```bash
cd hands/github
go build -o github-review-cli

# オプション: PATHの通った場所に移動
mv github-review-cli /usr/local/bin/
```

## 使い方

### インラインコメント

指定したファイル・行にコメントを作成：

```bash
github-review-cli inline \
  --owner octocat \
  --repo hello-world \
  --pr 123 \
  --path src/main.go \
  --line 42 \
  --body "この変数名はより具体的にすべきです"
```

**オプション:**
- `--side`: `LEFT` (削除行) or `RIGHT` (追加行、デフォルト)
- `--start-line`: マルチラインコメントの開始行

### PRコメント

PRに対して一般的なコメントを作成：

```bash
github-review-cli comment \
  --owner octocat \
  --repo hello-world \
  --pr 123 \
  --body "LGTM! 素晴らしい実装です。"
```

### レビュー

レビューを作成（Approve / Request Changes / Comment）：

```bash
github-review-cli review \
  --owner octocat \
  --repo hello-world \
  --pr 123 \
  --event APPROVE \
  --body "確認完了、マージOKです"
```

**`--event` オプション:**
- `APPROVE`: 承認
- `REQUEST_CHANGES`: 変更リクエスト
- `COMMENT`: コメントのみ

## AIエージェントからの利用例

Claudeやその他のAIエージェントは、このツールを直接実行できます：

```
$ github-review-cli inline --owner myorg --repo myrepo --pr 42 --path src/app.ts --line 15 --body "この関数は分割すべきです"
Created inline comment (ID: 12345678)
URL: https://github.com/myorg/myrepo/pull/42#discussion_r12345678
```

## ライセンス

MIT
