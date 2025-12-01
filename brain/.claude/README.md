# Code Review System v2.2

最新のClaude Agent Skills / Subagentsアーキテクチャに基づいた、モジュール式のコードレビューシステム。

## 📁 Directory Structure

```
.claude/
├── skills/
│   └── code-review/
│       ├── SKILL.md              # Level 2: Main skill instructions
│       ├── checklists/           # Level 3: Modular checklists
│       │   ├── general.md        # Applied to all files
│       │   ├── typescript.md
│       │   ├── react.md
│       │   ├── kotlin.md
│       │   ├── sql.md
│       │   └── test.md
│       ├── GUIDELINES.md         # Level 3: Evaluation guidelines
│       └── scripts/              # Level 3: Utility scripts
│
└── agents/
    └── code-reviewer.md          # Review-specialized sub-agent
```

## 🎯 Key Features

### 1. Progressive Disclosure Architecture
Claude公式のAgent Skillsアーキテクチャに準拠：
- **Level 1 (Metadata)**: スキル発見用の軽量メタデータ
- **Level 2 (Instructions)**: コアとなるレビュー手順
- **Level 3 (Resources)**: 言語別チェックリストを**必要な時だけ動的にロード**

### 2. Modular & Extensible
チェックリストは言語ごとに独立したファイルとして管理：
- 新しい言語（例: Python）を追加する場合は、`checklists/python.md`を作成するだけ
- 項目数の増減に柔軟に対応
- 必要なファイルのみ読み込むため、コンテキスト効率が高い

### 3. Complete Checklist Tracking
ロードされた全項目を網羅的にチェックし、各項目に明確なステータスを提供：
- ✅ **OK**: 基準を満たしている
- ⚠️ **NG**: 改善が必要
- 🔶 **CONDITIONAL**: 条件付き合格


---

## 🚀 Quick Start

### Step 1: サブエージェントを呼び出す

最もシンプルな方法：

```
@code-reviewer src/components/UserProfile.tsx をレビューしてください
```

これだけで、code-reviewerサブエージェントが：
1. ファイルの言語を検出（TypeScript + React）
2. **必要なチェックリストのみ**をロード（general.md + typescript.md + react.md）
3. 各項目を一つずつ評価
4. 完全なレポートを生成

### Step 2: レビュー結果を確認

出力は以下の形式で提供されます：

```markdown
## Checklist Results

### General Checklist

#### ✅ G01: マジックナンバーの排除
**Status**: OK
**Rationale**: ...

### TypeScript Checklist

#### ⚠️ TS06: Non-null assertion（!）の禁止
**Status**: NG
**Rationale**: ...
```

### Step 3: 修正

レポートの最後の「Summary」セクションを確認し、改善項目を修正していきます。

---

## 🎯 Use Cases

### ケース1: 新しい言語の追加

Pythonのチェックリストを追加したい場合：

1. `brain/.claude/skills/code-review/checklists/python.md` を作成
2. チェックリスト項目を記述

```markdown
# Python Checklist

## PY01: Type Hintsの活用
**目的**: 型安全性の向上
...
```

これだけで、次回からPythonファイルのレビュー時に自動的に適用されます。

### ケース2: 特定の観点に絞ったレビュー

```
# TypeScriptの型安全性のみ（general.mdは除外される場合があります）
@code-reviewer UserProfile.tsx をTypeScriptの型安全性に焦点を当ててレビューしてください
```

---

## 💡 FAQ

### Q1: チェックリストの項目数はいくつですか？

**A**: 固定ではありません。ロードされるファイルによって変動します。
- 基本: General (11項目)
- TypeScriptファイル: General (11) + TypeScript (14) = 25項目
- Reactファイル: General (11) + TypeScript (14) + React (11) = 36項目

### Q2: すべてのチェック項目をクリアする必要がありますか？

**A**: いいえ。NG項目は修正が推奨されますが、CONDITIONAL項目は文脈次第で許容されます。

---

## 📝 License & Maintenance

**Version**: 2.2.0  
**Updated**: 2025-11-30  
**Maintainer**: @Ryota-Onuma  
**Based on**: [Claude Agent Skills Documentation](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview)
