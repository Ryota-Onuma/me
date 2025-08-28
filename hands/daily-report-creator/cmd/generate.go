package cmd

import (
	"fmt"
	"time"

	"daily-report-creator/internal/report"
)

var generateCmd = &Command{
	Name:  "generate",
	Short: "Generate comprehensive daily report for specified date",
	Long: `Generate a comprehensive daily report for the specified date (YYYY-MM-DD) including:
1. Create basic template
2. Fetch GitHub activity
3. Integrate GitHub work
4. Integrate manual work
5. Generate final report

Uses today's date if no date is provided.`,
	Run: func(cmd *Command, args []string) error {
		date := time.Now().Format("2006-01-02")
		if len(args) > 0 {
			date = args[0]
		}

		fmt.Printf("Generating comprehensive daily report for %s...\n", date)

		// Step 1: Create template
		fmt.Println("1. Creating report template...")
		generator := report.NewGenerator(".")
		var err error
		if len(args) > 0 {
			err = generator.CreateDailyReportForDate(date)
		} else {
			err = generator.CreateDailyReport()
		}
		if err != nil {
			return fmt.Errorf("failed to create template: %v", err)
		}

		// Step 2: Fetch GitHub activity
		fmt.Println("2. Fetching GitHub activity...")
		collector := report.NewGitHubCollector(".")
		if len(args) > 0 {
			err = collector.CollectWorkForDate(date)
		} else {
			err = collector.CollectTodaysWork()
		}
		if err != nil {
			fmt.Printf("Warning: GitHub activity fetch failed: %v\n", err)
		}

		// Step 3: Integrate GitHub work into the report
		fmt.Println("3. Integrating GitHub work...")
		err = generator.IntegrateGitHubWork(date)
		if err != nil {
			fmt.Printf("Warning: GitHub work integration failed: %v\n", err)
		}

		// Step 4: Integrate manual work (if any exists)
		fmt.Println("4. Integrating manual work...")
		err = report.IntegrateManualWork(date)
		if err != nil {
			fmt.Printf("Warning: Manual work integration failed: %v\n", err)
		}

		fmt.Printf("✅ Comprehensive daily report generated for %s\n", date)
		fmt.Printf("📁 Report location: reports/%s/%s/daily-report.md\n",
			date[:4], date)
		fmt.Println("\n💡 To add manual work:")
		fmt.Println("   1. Edit the report file and add content in the comment section")
		fmt.Printf("   2. Run: go run main.go integrate-manual %s\n", date)

		return nil
	},
}
