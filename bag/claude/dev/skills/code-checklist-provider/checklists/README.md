# Custom Checklists

このディレクトリには、会社やプロジェクト固有のコードレビュールールを追加できます。

## 使い方

### 1. カスタムチェックリストの作成

標準チェックリストに加えて、`.local.md` サフィックスを持つファイルを作成します：

```bash
# 会社固有の一般ルール
checklists/general.local.md

# 会社固有のTypeScriptルール
checklists/typescript.local.md

# 会社固有のReactルール
checklists/react.local.md
```

### 2. フォーマット

標準チェックリストと同じフォーマットを使用します：

```markdown
# Custom General Checklist

## CG01: 会社固有のルール名
**目的**: このルールの目的
- **OK**: 良い例
- **NG**: 悪い例

**Examples**:
...
```

### 3. Gitignore

`.local.md` ファイルは自動的に `.gitignore` に含まれているため、リポジトリにコミットされません。これにより：

- ✅ 会社固有のルールを安全に管理
- ✅ プロジェクト固有のルールを追加
- ✅ 個人的なチェックリストを作成

### 4. 自動ロード

`code-reviewer` チームメンバーがレビューを実行すると、該当する `.local.md` ファイルが自動的にロードされます：

```
code-reviewer に src/components/UserProfile.tsx のレビューを依頼
```

上記は以下をロード：
- `checklists/general.md`
- `checklists/responsibility.md`
- `checklists/typescript.md`
- `checklists/react.md`
- `checklists/general.local.md` (存在する場合)
- `checklists/typescript.local.md` (存在する場合)
- `checklists/react.local.md` (存在する場合)

## サンプル

### `general.local.md` の例

```markdown
# Company-Specific General Rules

## CG01: 必須のコメントヘッダー
**目的**: すべてのファイルに会社の著作権表示を含める
- **OK**: ファイルの先頭に著作権コメントがある
- **NG**: 著作権コメントがない

## CG02: 禁止されたライブラリ
**目的**: セキュリティ上の理由で特定のライブラリを禁止
- **OK**: 承認されたライブラリのみ使用
- **NG**: `lodash`, `moment` などの禁止ライブラリを使用
```

### `typescript.local.md` の例

```markdown
# Company-Specific TypeScript Rules

## CT01: 必須のJSDoc
**目的**: すべてのpublic関数にJSDocを記述
- **OK**: public関数にJSDocがある
- **NG**: JSDocがない

## CT02: 命名規則
**目的**: 会社の命名規則に従う
- **OK**: `getUserById`, `UserRepository`
- **NG**: `get_user_by_id`, `user_repository`
```
