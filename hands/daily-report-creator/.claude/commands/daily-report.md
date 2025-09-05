---
command: /daily-report
description: サブエージェントをオーケストレーションして日報生成を進める
argument-hint: "[date] - YYYY-MM-DD (default: today)"
allowed-tools: [Task(*), Read(*)]
---

# Daily Report Generation Pipeline

## 📋 Overview

```yaml
pipeline:
  name: daily-report-generation
  purpose: 複数データソースから日報を生成
  execution-mode: multi-agent-orchestration
  delegation-only: true
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
  - step: initialize-report
    command: go run main.go create
    description: 基本テンプレートの作成
    
  - step: parallel-data-collection
    execution: concurrent
    agents:
      
      - agent: github-client
        reference: .claude/agents/github-client.md
        goal: GitHubアクティビティ収集
        deliverables:
          directory: reports/YEAR/DATE/github-work/
          files:
            - work-summary.json
            - summary.md
            - pr-*/  # PR詳細ディレクトリ群
            
      - agent: slack-client
        reference: .claude/agents/slack-client.md
        goal: Slack関与メッセージ収集
        deliverables:
          directory: reports/YEAR/DATE/slack-work/
          files:
            - slack-summary.json
            - summary.md
            - messages/  # 個別メッセージファイル群
            
```

## 🎯 Orchestrator Responsibilities

```yaml
responsibilities:
  coordination:
    - task: 3エージェント並列実行と完了待機
    - task: 進捗状況の集約と監視
    - task: エージェント間の依存関係解決
    
  error-handling:
    - task: 個別エージェント失敗時のリトライ判断
    - task: スコープ調整要請（部分的成功の許容）
    - task: クリティカルエラーの即座な報告
    
  reporting:
    - task: 各成果物パスの一覧化
    - task: 次フェーズ（統合・最終生成）への引き継ぎ情報
    - task: 実行サマリーと推奨次ステップの提示
```

## 📁 Expected Output Structure

```yaml
deliverables:
  base-template:
    - reports/YEAR/DATE/daily-report.md
    
  github-artifacts:
    - reports/YEAR/DATE/github-work/work-summary.json
    - reports/YEAR/DATE/github-work/summary.md
    - reports/YEAR/DATE/github-work/pr-*/
    
  slack-artifacts:
    - reports/YEAR/DATE/slack-work/slack-summary.json
    - reports/YEAR/DATE/slack-work/summary.md
    - reports/YEAR/DATE/slack-work/messages/
    
```

## 🔗 Related Agents

```yaml
agents:
  github-client:
    path: .claude/agents/github-client.md
    purpose: PR作業・コード変更の詳細収集
    
  slack-client:
    path: .claude/agents/slack-client.md
    purpose: コミュニケーション活動の抽出
    
```

## 📝 Execution Notes

```yaml
constraints:
  - scope: データ収集フェーズのみ
  - integration: 別コマンド（/compile-report）で実施
  - direct-execution: prohibited（委譲専用）
```
