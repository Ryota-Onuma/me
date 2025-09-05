package cmd

import (
	"daily-report-creator/internal/report"
	"fmt"
	"time"
)

var fetchCalendarEventsCmd = &Command{
	Name:  "fetch-calendar-events",
	Short: "Collect Google Calendar events for specified date",
	Long:  "Collect Google Calendar events for the specified date and generate markdown files for each event. Accepts date in YYYY-MM-DD format, uses today's date if not provided.",
	Run: func(cmd *Command, args []string) error {
		date := time.Now().Format("2006-01-02")
		if len(args) > 0 {
			date = args[0]
		}

		fmt.Printf("📅 Collecting Google Calendar events for %s...\n", date)

		// Collect Google Calendar events
		collector := report.NewCalendarCollector(".")
		var err error
		if len(args) > 0 {
			err = collector.CollectEventsForDate(args[0])
		} else {
			err = collector.CollectTodaysEvents()
		}
		if err != nil {
			return fmt.Errorf("Calendar event collection failed: %v", err)
		}

		fmt.Printf("✅ Google Calendar event collection completed for %s!\n", date)
		return nil
	},
}
