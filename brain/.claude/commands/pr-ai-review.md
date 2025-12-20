---
description: コードレビューを実行し、結果をGitHub PRに自動投稿
allowed-tools: Bash(gh:*)
---

# PR AI Review Workflow

## 実行手順

### Step 1: PR URLの確定

- `$ARGUMENTS` で渡されたPR URLをパース
  - 形式: `https://github.com/{owner}/{repo}/pull/{number}`
- **URLが未指定または不正な場合**：ユーザーに確認を求めて中断する

### Step 2: 並列レビュー

以下の2つのレビューを**並列で**実行する：

- **@code-reviewer**: コード品質レビュー（実装品質、可読性、型、テスト）
- **@architecture-reviewer**: アーキテクチャレビュー（責務分離、依存関係、循環依存）

### Step 3: ファクトチェック

- **@fact-checker**: Step 2 の両レビュー結果を検証
  - ファイル参照・コード行の実在性確認
  - 依存関係の事実確認

### Step 4: GitHub投稿

#### コメントタイプ判定

| タイプ | 条件 | コマンド |
|--------|------|----------|
| Inline | 特定ファイル・行への指摘 | `github-review-cli inline --path {path} --line {line}` |
| Review | 全体的な評価・複数ファイルにまたがる問題 | `github-review-cli review --event {EVENT}` |
| Comment | 質問・確認事項 | `github-review-cli comment` |

**Review Event判定:**
- `APPROVE`: クリティカルな問題なし
- `REQUEST_CHANGES`: 修正必須の問題あり
- `COMMENT`: 判断保留

#### 投稿順序

1. Inline Comments を先に投稿（各ファイル・行への指摘）
2. Comment があれば投稿（質問・確認事項）
3. Review を最後に投稿（全体サマリー）

### Step 5: 結果報告

```markdown
# GitHub投稿結果

## サマリー
| 種別 | 件数 | ステータス |
|------|------|-----------|
| Inline Comments | N件 | ✅ |
| Review | 1件 | ✅ |

## 詳細
- Review Event: {APPROVE|REQUEST_CHANGES|COMMENT}
- Review URL: {URL}
```

---

## ツールパス

```
hands/github/review/github-review-cli
```

事前に `gh auth login` で認証済みであることを確認すること。

