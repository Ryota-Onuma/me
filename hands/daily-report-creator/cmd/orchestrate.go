package cmd

import (
	"fmt"
	"time"
)

var orchestrateCmd = &Command{
	Name:  "orchestrate",
	Short: "Orchestrate daily report generation using Claude Code subagents",
	Long: `
Orchestrate daily report generation by delegating tasks to specialized Claude Code subagents:
- github-client: Collects and analyzes GitHub activity
- slack-client: Collects and analyzes Slack activity

This command is designed to be called from Claude Code's /daily-report slash command
to demonstrate subagent orchestration capabilities.

Usage:
  go run main.go orchestrate [date]

Arguments:
  date    Date in YYYY-MM-DD format (default: today)

Example:
  go run main.go orchestrate
  go run main.go orchestrate 2025-08-26
`,
	Run: func(cmd *Command, args []string) error {
		date := time.Now().Format("2006-01-02")
		if len(args) > 0 {
			date = args[0]
		}

		fmt.Printf("🎭 Orchestrating daily report generation for %s...\n", date)
		fmt.Printf("ℹ️  This command is optimized for Claude Code subagent delegation\n\n")

		// Display subagent delegation instructions
		fmt.Printf("📋 SUBAGENT DELEGATION PLAN\n")
		fmt.Printf("═══════════════════════════\n\n")

		fmt.Printf("1️⃣  GitHub Client Subagent:\n")
		fmt.Printf("   Task: Collect GitHub activity for %s\n", date)
		fmt.Printf("   Method: Use Task tool with subagent_type: 'general-purpose'\n")
		fmt.Printf("   Command: go run main.go fetch-github-activity %s\n", date)
		fmt.Printf("   Output: reports/%s/github-work/\n\n", date[:4]+"/"+date)

		fmt.Printf("2️⃣  Slack Client Subagent:\n")
		fmt.Printf("   Task: Collect Slack activity for %s\n", date)
		fmt.Printf("   Method: Use Task tool with subagent_type: 'general-purpose'\n") 
		fmt.Printf("   Command: go run main.go fetch-slack-activity %s\n", date)
		fmt.Printf("   Output: reports/%s/slack-work/\n\n", date[:4]+"/"+date)

		fmt.Printf("3️⃣  Integration Phase:\n")
		fmt.Printf("   Task: Integrate collected data into daily report\n")
		fmt.Printf("   Method: Analyze outputs and generate comprehensive report\n")
		fmt.Printf("   Output: reports/%s/daily-report.md\n\n", date[:4]+"/"+date)

		fmt.Printf("🎯 CLAUDE CODE SUBAGENT PROMPTS\n")
		fmt.Printf("═══════════════════════════════\n\n")

		fmt.Printf("GitHub Client Prompt:\n")
		fmt.Printf("```\n")
		fmt.Printf("GitHubから%sの作業履歴を収集してください。\n\n", date)
		fmt.Printf("実行内容:\n")
		fmt.Printf("1. `go run main.go fetch-github-activity %s` を実行\n", date)
		fmt.Printf("2. 出力されたgithub-work/ディレクトリの内容を確認\n")
		fmt.Printf("3. 各PR詳細ファイルを分析\n")
		fmt.Printf("4. 作業サマリーとして要点をまとめる\n\n")
		fmt.Printf("必要なファイル:\n")
		fmt.Printf("- internal/report/github.go (既存実装)\n")
		fmt.Printf("- cmd/fetch_github_activity.go (既存コマンド)\n")
		fmt.Printf("```\n\n")

		fmt.Printf("Slack Client Prompt:\n")
		fmt.Printf("```\n")
		fmt.Printf("Slackから%sのアクティビティを収集してください。\n\n", date)
		fmt.Printf("実行内容:\n")
		fmt.Printf("1. `go run main.go fetch-slack-activity %s` を実行\n", date)
		fmt.Printf("2. 出力されたslack-work/ディレクトリの内容を確認\n")
		fmt.Printf("3. チャネル別メッセージファイルを分析\n")
		fmt.Printf("4. アクティビティサマリーとして要点をまとめる\n\n")
		fmt.Printf("必要な設定:\n")
		fmt.Printf("- SLACK_TOKEN環境変数が設定されていること\n")
		fmt.Printf("- internal/report/slack.go (既存実装)\n")
		fmt.Printf("- cmd/fetch_slack_activity.go (既存コマンド)\n")
		fmt.Printf("```\n\n")

		fmt.Printf("✨ Ready for Claude Code subagent orchestration!\n")
		fmt.Printf("💡 Use /daily-report command in Claude Code to execute this plan\n")

		return nil
	},
}