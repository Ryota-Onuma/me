---
description: Report Integrator サブエージェントに委譲して、収集済みデータを日報へ統合するためのスラッシュコマンド。
argument-hint: "[date] - YYYY-MM-DD (default: today)"
allowed-tools: Task(*), Read(*)
---

# /compile-report

## Usage

`/compile-report [YYYY-MM-DD]`

## Inputs

- `DATE`（省略可）: `YYYY-MM-DD`。未指定時は当日。

## What to do

- Use `report-integrator` and perform tasks.
  - Goal: 収集済み `github-work/summary.md` / `manual-draft.md` / `slack-work/summary.md`をそれぞれ要約したあと、対象日の日報へ統合
  - Refer: `.claude/agents/report-integrator.md`
  - Deliverables: `reports/YEAR/DATE/github-work/summary.md` / `reports/YEAR/DATE/manual-draft.md` / ` reports/YEAR/DATE/slack-work/summary.md` / `reports/YEAR/DATE/daily-report.md `

## Orchestrator Responsibilities

- Report Integrator に統合作業を一任し、進捗/結果を収集
- 収集物が存在しない場合のハンドリング（スキップ/警告）を伝達
- 最終成果物のパスを提示

## Notes

- 生成/ファイル編集はサブエージェント側で実行（本コマンドはオーケストレーションのみ）。
