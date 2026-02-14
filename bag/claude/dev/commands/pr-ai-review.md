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

### Step 2: エージェントチームの作成と並列レビュー

以下の3名のチームメンバーで**エージェントチーム**を作成する：

1. **code-reviewer** — コード品質レビュー担当（実装品質、可読性、型、テスト）
2. **architecture-reviewer** — アーキテクチャレビュー担当（責務分離、依存関係、循環依存）
3. **fact-checker** — ファクトチェック担当（レビュー結果の正確性検証）

チーム作成後、以下の順序でタスクを実行：

#### 2a. 並列レビュー（code-reviewer & architecture-reviewer）

`code-reviewer` と `architecture-reviewer` に PR の diff を対象としたレビュータスクを割り当て、**並列実行**する。

- 両チームメンバーの完了を待つ

#### 2b. ファクトチェック（fact-checker）

並列レビュー完了後、`fact-checker` に以下のタスクを割り当て：
- 両レビュー結果の検証
- ファイル参照・コード行の実在性確認
- 依存関係の事実確認

**事実と異なる疑いがある場合：**
`fact-checker` は該当のレビュー担当（`code-reviewer` / `architecture-reviewer`）にメッセージを送り、根拠の提示や訂正を求める。やり取りを経て事実関係が確定するまで詰めること。

`fact-checker` の完了を待つ。

#### 2c. チームのクリーンアップ

全タスク完了後、エージェントチームをクリーンアップする。

### Step 3: GitHub投稿

`github-review` スキルを使用してレビュー結果をPRに投稿する。

スキルの手順（コメントタイプ判定、投稿順序、Review Event判定）に従い、レビュー結果を適切なコメントタイプで投稿すること。

### Step 4: 結果報告

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

