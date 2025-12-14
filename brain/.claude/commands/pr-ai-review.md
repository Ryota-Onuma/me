---
description: 3つの視点でコードをレビューし、結果をGitHubに自動投稿するワークフロー
---

# Comprehensive Code Review Plus Workflow

本ドキュメントは、コード変更を **局所（虫の目）・構造（鳥の目）・時間/影響（魚の目）** の三視点から体系的にレビューし、その結果を **GitHub PRに自動投稿** するワークフローを定義する。

---

## 入力要件

### 必須入力

1. **GitHub PR URL**
   * 形式: `https://github.com/{owner}/{repo}/pull/{number}`
   * 例: `https://github.com/octocat/hello-world/pull/123`

### PR URLパース処理

```text
入力URLから自動抽出:
- owner: リポジトリオーナー
- repo: リポジトリ名
- pr_number: PR番号
```

---

## Phase 1: Parallel Verification Streams（並行検証ストリーム）

**目的**：3つの視点それぞれに対し、レビュー生成とその検証を 1:1 のペアで完結させる。以下の3つのストリームを**並行して**実行する。

### Stream A: Code Quality Verification (虫の目)

1. **@code-reviewer**
   * ファイル単位の詳細レビューを実行（実装品質、可読性、型、テスト）
2. **@fact-checker**
   * **入力**: 上記 `@code-reviewer` の出力のみ
   * **検証対象**: ファイル参照の正確性、指摘されたコード行の実在性、引用の正確さ
   * **出力**: Verified Code Review Report

### Stream B: Architecture Verification (鳥の目)

1. **@architecture-reviewer**
   * 構造・依存関係の分析を実行（責務分離、循環依存）
2. **@fact-checker**
   * **入力**: 上記 `@architecture-reviewer` の出力のみ
   * **検証対象**: 依存関係の事実確認、モジュール境界の妥当性
   * **出力**: Verified Architecture Report

### Stream C: Impact Verification (魚の目)

1. **@change-impact-reviewer**
   * 変更による影響範囲とリスクの特定を実行
2. **@fact-checker**
   * **入力**: 上記 `@change-impact-reviewer` の出力のみ
   * **検証対象**: 影響を受けるファイルの依存パス確認、リスク評価の根拠
   * **出力**: Verified Impact Report

---

## Phase 2: GitHub Comment Strategy（コメント戦略決定）

**実行タイミング**: すべてのストリーム (A, B, C) が完了した後。

### コメントタイプ判定基準

各指摘事項について、以下の基準でコメントタイプを自動判定する：

#### 1. **Inline Comment** (`inline` コマンド)

以下の条件を**すべて**満たす場合に使用：
- 特定ファイルの特定行に対する指摘である
- ファイルパス(`path`)と行番号(`line`)が明確に特定できる
- 変更されたファイル（diff）に含まれる行である

```bash
github-review-cli inline \
  --owner {owner} --repo {repo} --pr {pr_number} \
  --path {file_path} --line {line_number} \
  --body "{指摘内容}"
```

#### 2. **Review Comment** (`review` コマンド)

以下のいずれかの場合に使用：
- 全体的なアーキテクチャに関する指摘
- 複数ファイルにまたがる問題
- プロジェクト全体の設計方針に関するフィードバック
- 変更の影響範囲に関する総合評価

```bash
github-review-cli review \
  --owner {owner} --repo {repo} --pr {pr_number} \
  --event {COMMENT|REQUEST_CHANGES|APPROVE} \
  --body "{レビューサマリー}"
```

**`--event` 判定基準:**
- `APPROVE`: クリティカルな問題がなく、軽微な改善提案のみ
- `REQUEST_CHANGES`: 修正必須の問題が1つ以上存在
- `COMMENT`: 確認や質問が主で、明確な判断を保留

#### 3. **PR Comment** (`comment` コマンド)

以下の場合に使用：
- 質問や確認事項
- レビュー外の補足情報
- 議論の開始

```bash
github-review-cli comment \
  --owner {owner} --repo {repo} --pr {pr_number} \
  --body "{コメント内容}"
```

---

## Phase 3: GitHub Posting（結果投稿）

### 投稿順序

1. **Inline Comments を先に投稿**
   - 各ファイル・行への具体的な指摘
   
2. **Review を最後に投稿**
   - 全体サマリーとして統合
   - イベントタイプを決定（APPROVE/REQUEST_CHANGES/COMMENT）

### Review本文フォーマット

```markdown
## 📋 レビュー結果サマリー

### 概要
- レビュープロセス: 3 Parallel Streams (Review -> Fact Check)

### 検出された問題
| 重要度 | カテゴリ | 件数 |
|--------|----------|------|
| 🔴 Critical | - | N件 |
| 🟡 Warning | - | N件 |
| 🔵 Info | - | N件 |

### 詳細

#### 🐛 Code Quality (虫の目)
[Stream A の検証済み結果を記載]

#### 🦅 Architecture (鳥の目)
[Stream B の検証済み結果を記載]

#### 🐟 Change Impact (魚の目)
[Stream C の検証済み結果を記載]
```

---

## Phase 4: 実行報告

投稿完了後、以下の情報を返却する：

```markdown
# GitHub投稿結果

## 投稿サマリー
| 種別 | 件数 | ステータス |
|------|------|-----------|
| Inline Comments | N件 | ✅ 完了 |
| Review | 1件 | ✅ 完了 |

## 詳細
- Review Event: {APPROVE|REQUEST_CHANGES|COMMENT}
- Review URL: {URL}

## 投稿済みInline Comments
1. `{path}:{line}` - {概要}
2. ...
```

---

## ツールパス

GitHub Review CLI は以下のパスに存在する：

```
hands/github/review/github-review-cli
```

事前に `gh auth login` で認証済みであることを確認すること。
