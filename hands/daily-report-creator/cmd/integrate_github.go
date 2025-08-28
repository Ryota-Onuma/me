package cmd

import (
	"fmt"
	"time"

	"daily-report-creator/internal/report"
)

var integrateGithubCmd = &Command{
	Name:  "integrate-github",
	Short: "Integrate GitHub work data into daily report",
	Long: `Integrate GitHub work data into the daily report for the specified date (YYYY-MM-DD).
This command reads the GitHub work data collected by fetch-github-activity and 
integrates it into the daily report markdown file.

Uses today's date if no date is provided.`,
	Run: func(cmd *Command, args []string) error {
		date := time.Now().Format("2006-01-02")
		if len(args) > 0 {
			date = args[0]
		}

		fmt.Printf("Integrating GitHub work data for %s...\n", date)

		generator := report.NewGenerator(".")
		err := generator.IntegrateGitHubWork(date)
		if err != nil {
			return fmt.Errorf("failed to integrate GitHub work: %v", err)
		}

		fmt.Printf("✅ GitHub work integrated for %s\n", date)
		fmt.Printf("📁 Report location: reports/%s/%s/daily-report.md\n",
			date[:4], date)

		return nil
	},
}
