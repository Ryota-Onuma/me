package cmd

import (
	"daily-report-creator/internal/report"
	"fmt"
	"time"
)

var fetchGithubActivityCmd = &Command{
	Name:  "fetch-github-activity",
	Short: "Collect GitHub activity and perform PR analysis",
	Long:  "Collect GitHub activity, perform detailed PR analysis and generate comprehensive reports. Accepts date in YYYY-MM-DD format, uses today's date if not provided.",
	Run: func(cmd *Command, args []string) error {
		date := time.Now().Format("2006-01-02")
		if len(args) > 0 {
			date = args[0]
		}

		fmt.Printf("🔍 Collecting GitHub activity for %s...\n", date)

		// Collect GitHub activity
		collector := report.NewGitHubCollector(".")
		var err error
		if len(args) > 0 {
			err = collector.CollectWorkForDate(args[0])
		} else {
			err = collector.CollectTodaysWork()
		}
		if err != nil {
			return fmt.Errorf("GitHub activity collection failed: %v", err)
		}

		// Perform PR analysis
		fmt.Printf("🔬 Analyzing PRs...\n")
		analyzer := NewPRAnalyzer(".")
		err = analyzer.AnalyzeTodaysPRs(date)
		if err != nil {
			return fmt.Errorf("PR analysis failed: %v", err)
		}

		// Integrate analysis results into daily report using Claude Code
		fmt.Printf("📝 Integrating analysis into daily report using Claude Code...\n")
		err = analyzer.IntegrateAnalysisUsingClaude(date)
		if err != nil {
			fmt.Printf("⚠️ Failed to integrate analysis into report: %v\n", err)
			fmt.Printf("📝 Analysis completed but not integrated into daily report\n")
			return nil
		}

		fmt.Printf("✅ GitHub activity collection and analysis completed for %s!\n", date)
		return nil
	},
}