---
description: 3つの視点（虫の目・鳥の目・魚の目）でコードを包括的にレビューするワークフロー
---

# Comprehensive Code Review Workflow

本ドキュメントは、コード変更を **局所（虫の目）・構造（鳥の目）・時間/影響（魚の目）** の三視点から体系的にレビューするための、再現性と拡張性を備えたワークフローを定義する。

設計原則は以下の3点に集約される：

* **視点の分離**：異なる関心事を独立したレビュワーとして明示的に分ける
* **並行性の最大化**：独立可能なレビューおよびその検証は並行実行する
* **事実ベースの統合**：各視点の出力は、必ずその場でファクトチェックを経てから統合へ回す

---

## Phase 0: Review Setup（事前確認）

レビューを開始する前に、以下の情報を必ず明確化する。

### 必須入力

1. **レビュー対象**
   * PR番号（URL) / 対象ディレクトリ / ファイル一覧 / git statusで現れる差分 / commit

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

## Phase 2: Integrated Review Output（統合結果返却）

**実行タイミング**: すべてのストリーム (A, B, C) が完了した後。
**原則**：各ストリームから出力された「検証済みレポート (Verified Report)」のみを使用し、統合サマリーを作成する。

### 統合サマリー（ユーザー返却用）

```markdown
# レビュー結果サマリー

## 概要
- レビュー対象:
- 実行プロセス: 3 Parallel Streams (Review -> Fact Check)

## 修正アクション（Actionable Fixes & Prompts）
[修正が必要な事項を個別に列挙し、それぞれに対応するAI修正プロンプトを記載]

### 1. [場所/コンテキスト] [問題の要約]
- **詳細**: [検証済みの問題点と改善案]
- **AI修正プロンプト**:
  ```text
  [この単一の指摘を修正するために、エージェントにそのまま貼り付けて実行できる具体的な指示]
  (対象ファイルパスや具体的な修正要件を含めること)
  ```

### 2. ...

---

## 詳細レポート

### 1. Code Review (Verified)
[Stream A の検証済み結果を記載]

### 2. Architecture Review (Verified)
[Stream B の検証済み結果を記載]

### 3. Change Impact Analysis (Verified)
[Stream C の検証済み結果を記載]
```
