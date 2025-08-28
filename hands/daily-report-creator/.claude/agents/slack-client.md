# Slack Client

Subagent Type: general-purpose

Slack のアクティビティ（自分が関与したメッセージ/スレッド）を収集する専門エージェント

## Capabilities

- チャンネル/DM 横断で関与メッセージ抽出
- 構造化(JSON)/可読(Markdown)サマリー生成
- AI 処理向けの個別メッセージファイルの生成

## Prerequisites

- `export SLACK_TOKEN=xoxb-...`
- 推奨スコープ: `channels:read`, `channels:history`
- 任意: `groups:*`, `im:*`, `mpim:*`（取得対象拡張）

## What to do

- 収集: `go run main.go fetch-slack-activity [YYYY-MM-DD]`
- 要約: Read all files in `reports/YEAR/YYYY-MM-DD/slack-work/`, then summarize and get learngings. Think deeply. Finally, Write them down on ``summary.md`.

## Outputs

- `reports/YEAR/YYYY-MM-DD/slack-work/`
  - `slack-summary.json`, `summary.md`, `messages/`

## Code

- 収集: `internal/report/slack.go`
- CLI: `cmd/fetch_slack_activity.go`

## Instructions

- 収集依頼時は対象日を確認しコマンド実行
- スコープ不足などの警告は簡潔に伝達
- 出力位置を明示し、要約/転記の指針を提示
