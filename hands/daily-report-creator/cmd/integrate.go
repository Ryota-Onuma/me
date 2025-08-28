package cmd

import (
	"fmt"
	"time"

	"daily-report-creator/internal/report"
)

var integrateManualCmd = &Command{
	Name:  "integrate-manual",
	Short: "Integrate manual work from comments into daily report",
	Long:  "Parse manual work from HTML comments in the daily report and integrate it into the proper section",
	Run: func(cmd *Command, args []string) error {
		date := time.Now().Format("2006-01-02")
		if len(args) > 0 {
			date = args[0]
		}

		fmt.Printf("Integrating manual work for %s...\n", date)

		if err := report.IntegrateManualWork(date); err != nil {
			return fmt.Errorf("failed to integrate manual work: %v", err)
		}

		fmt.Printf("✅ Manual work integrated successfully for %s\n", date)
		return nil
	},
}
