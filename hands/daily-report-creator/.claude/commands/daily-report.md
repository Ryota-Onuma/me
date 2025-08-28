---
description: サブエージェントをオーケストレーションして日報生成を進めるスラッシュコマンド。自身は直接コマンドを実行せず、委譲のみを行う。
argument-hint: "[date] - YYYY-MM-DD (default: today)"
allowed-tools: Task(*), Read(*)
---

# /daily-report

## Usage

`/daily-report [YYYY-MM-DD]`

## Inputs

- `DATE`（省略可）: `YYYY-MM-DD`。未指定時は当日。

## What to do

- Run `go run main.go create`

- Use `github-client` and perform tasks.

  - Goal: `DATE` の GitHub アクティビティを収集
  - Refer: `.claude/agents/github-client.md`
  - Deliverables: `reports/YEAR/DATE/github-work/`（`work-summary.json`, `summary.md`, `pr-*`）

- Use `slack-client`
  - Goal: `DATE` の Slack アクティビティを収集（自分が関与したメッセージ）
  - Refer: `.claude/agents/slack-client.md`
  - Deliverables: `reports/YEAR/DATE/slack-work/`（`slack-summary.json`, `summary.md`, `messages/`）

## Orchestrator Responsibilities

- 2 つのサブエージェントにタスクを発行し、完了を待機
- 進捗・失敗を集約し、必要に応じてリトライ/スコープ調整を依頼
- 成果物パスを一覧化して提示（統合や最終生成は別フェーズで実施）

## Related Agents

- GitHub: `.claude/agents/github-client.md`
- Slack: `.claude/agents/slack-client.md`
