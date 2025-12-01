# Custom Architecture Checklists

このディレクトリには、会社やプロジェクト固有のアーキテクチャルールを追加できます。

## 使い方

### 1. カスタムチェックリストの作成

標準チェックリストに加えて、`.local.md` サフィックスを持つファイルを作成します：

```bash
# 会社固有の構造ルール
checklists/structure.local.md

# 会社固有の依存関係ルール
checklists/dependencies.local.md
```

### 2. フォーマット

標準チェックリストと同じフォーマットを使用します：

```markdown
# Custom Structure Rules

## CS01: 会社固有のディレクトリ構造
**Goal**: 特定のディレクトリ構造に従う
- **OK**: 良い例
- **NG**: 悪い例
```

### 3. Gitignore

`.local.md` ファイルは自動的に `.gitignore` に含まれています。

### 4. 自動ロード

`@architecture-reviewer` を使用すると、該当する `.local.md` ファイルが自動的にロードされます：

```
@architecture-reviewer src/features/auth/
```

上記は以下をロード：
- `checklists/structure.md`
- `checklists/dependencies.md`
- `checklists/structure.local.md` (存在する場合)
- `checklists/dependencies.local.md` (存在する場合)

## サンプル

### `structure.local.md` の例

```markdown
# Company-Specific Structure Rules

## CS01: 必須のディレクトリ
**Goal**: すべてのfeatureに特定のディレクトリが存在する
- **OK**: `components/`, `hooks/`, `utils/` が存在
- **NG**: 必須ディレクトリが欠けている

## CS02: ファイル命名規則
**Goal**: 会社の命名規則に従う
- **OK**: `UserProfile.component.tsx`, `useAuth.hook.ts`
- **NG**: `UserProfile.tsx`, `useAuth.ts`
```

### `dependencies.local.md` の例

```markdown
# Company-Specific Dependency Rules

## CD01: 禁止された依存関係
**Goal**: 特定のモジュール間の依存を禁止
- **OK**: `features/auth` は `features/billing` に依存しない
- **NG**: クロスフィーチャー依存が存在

## CD02: 必須のアダプタパターン
**Goal**: すべての外部APIアクセスはアダプタ経由
- **OK**: `infrastructure/adapters/` 経由でAPIにアクセス
- **NG**: 直接APIクライアントをインポート
```
