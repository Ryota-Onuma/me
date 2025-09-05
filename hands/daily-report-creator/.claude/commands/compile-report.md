---
command: /compile-report
description: Report Integrator サブエージェントに委譲して、収集済みデータを日報へ統合
argument-hint: "[date] - YYYY-MM-DD (default: today)"
allowed-tools: [Task(*), Read(*)]
---

# Compile Report Orchestration

## 📋 Overview

```yaml
pipeline:
  name: compile-report
  purpose: 収集済みデータを日報へ統合
  delegation-target: report-integrator
  execution-mode: orchestration-only
```

## ⚙️ Configuration

```yaml
inputs:
  DATE:
    type: string
    format: YYYY-MM-DD
    required: false
    default: today
```

## 🔄 Orchestration Flow

```yaml
workflow:
  - step: delegate-to-agent
    agent: report-integrator
    reference: .claude/agents/report-integrator.md
    
    goals:
      - action: summarize-and-integrate
        sources:
          - reports/YEAR/DATE/github-work/summary.md
          - reports/YEAR/DATE/manual-draft.md
          - reports/YEAR/DATE/slack-work/summary.md
        target: reports/YEAR/DATE/daily-report.md
    
    deliverables:
      structured: 
        - reports/YEAR/DATE/github-work/summary.md
        - reports/YEAR/DATE/manual-draft.md
        - reports/YEAR/DATE/slack-work/summary.md
      final:
        - reports/YEAR/DATE/daily-report.md
```

## 🎯 Orchestrator Responsibilities

```yaml
responsibilities:
  - monitor: agent進捗とタスク完了状況
  - handle: 収集物不存在時の適切なハンドリング（スキップ/警告）
  - aggregate: エージェント結果の集約と報告
  - report: 最終成果物パスの明示
```

## 📝 Execution Notes

```yaml
constraints:
  - execution: サブエージェント完全委譲
  - scope: オーケストレーションのみ
  - file-ops: サブエージェント側で実行
```
