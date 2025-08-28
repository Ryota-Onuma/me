package cmd

import (
	"fmt"
	"time"

	"daily-report-creator/internal/report"
)

var fetchSlackActivityCmd = &Command{
	Name:  "fetch-slack-activity",
	Short: "Collect Slack activity for daily report",
	Long: `Collect your Slack messages and activity for the specified date (YYYY-MM-DD).
This command retrieves all your Slack messages and activity from the specified date 
and stores them in structured format for integration into daily reports.

Uses today's date if no date is provided.`,
	Run: func(cmd *Command, args []string) error {
		date := time.Now().Format("2006-01-02")
		if len(args) > 0 {
			date = args[0]
		}

		fmt.Printf("Collecting Slack activity for %s...\n", date)

		collector := report.NewSlackCollector(".")
		err := collector.CollectWorkForDate(date)
		if err != nil {
			return fmt.Errorf("failed to collect Slack activity: %v", err)
		}

		fmt.Printf("✅ Slack activity collected for %s\n", date)
		fmt.Printf("📁 Activity data saved to: reports/%s/%s/slack-work/\n",
			date[:4], date)

		return nil
	},
}
