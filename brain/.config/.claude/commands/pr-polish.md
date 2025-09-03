---
description: "PR情報を読み取り、テンプレートがあれば使用して英語のみのPR本文を生成し、英語タイトルを設定してPRを更新"
argument-hint: [pr-url]
allowed-tools: Bash(gh:*), Bash(jq:*), Bash(sed:*), Bash(mktemp:*), Bash(cat:*), Bash(rm:*)
---

# /pr-polish

**引数:** `$1` = Pull Request URL (例: `https://github.com/OWNER/REPO/pull/123`)

PR の変更内容とテンプレートを読み込み、**英語のみ**の本文と**英語タイトル**を生成して PR を更新します。

## データ収集

### PR 情報:

`gh pr view "$1" --json number,title,body,baseRefName,headRefName,url`

### 変更ファイル:

`gh pr diff "$1" --name-only`

### 変更内容:

`gh pr diff "$1"`

## 要件

- **<PR タイトル>:** 英語のみ、具体的でアクション指向
- **<PR 本文>:** **必ず英語のみで記述すること**、簡潔で正確、変更内容に基づく。`PULL_REQUEST_TEMPLATE.md` が見つかった場合は見出しと順序を維持
- **Issue 参照:** 該当する場合は `Fixes #123` で自動リンク

### テンプレートなしの場合の<PR 本文>の構成

1. **Summary** (English only)
2. **Changes** (English only, bullet points per file)
3. **Tests** (English only, procedures and expected results)
4. **Risks** (English only)

## 処理フロー

1. 上記のコマンドで PR 情報を収集
2. PR テンプレートがある場合は取得 (`.github/pull_request_template.md` などをチェック)
3. 変更内容を分析して英語のみの本文を生成
4. 英語のタイトルを生成
5. `gh pr edit "$1" --title "<PR タイトル>" --body "<PR 本文>"` で PR を更新
6. 更新結果をプレビュー表示
