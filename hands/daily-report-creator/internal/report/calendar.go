package report

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"strings"
	"time"
)

type CalendarCollector struct {
	BaseDir string
	APIKey  string
}

// Google Calendar API v3 response structures
type GoogleCalendarResponse struct {
	Items []GoogleCalendarEvent `json:"items"`
}

type GoogleCalendarEvent struct {
	ID          string                   `json:"id"`
	Summary     string                   `json:"summary"`
	Description string                   `json:"description"`
	Start       GoogleCalendarDateTime   `json:"start"`
	End         GoogleCalendarDateTime   `json:"end"`
	Location    string                   `json:"location"`
	Attendees   []GoogleCalendarAttendee `json:"attendees"`
	HtmlLink    string                   `json:"htmlLink"`
}

type GoogleCalendarDateTime struct {
	DateTime string `json:"dateTime"`
	Date     string `json:"date"`
	TimeZone string `json:"timeZone"`
}

type GoogleCalendarAttendee struct {
	Email       string `json:"email"`
	DisplayName string `json:"displayName"`
}

// Internal structure
type CalendarEvent struct {
	ID          string    `json:"id"`
	Summary     string    `json:"summary"`
	Description string    `json:"description"`
	StartTime   time.Time `json:"start_time"`
	EndTime     time.Time `json:"end_time"`
	Location    string    `json:"location"`
	Attendees   []string  `json:"attendees"`
	URL         string    `json:"url"`
}

type EventsSummary struct {
	Date   string          `json:"date"`
	Events []CalendarEvent `json:"events"`
	Stats  EventStats      `json:"stats"`
}

type EventStats struct {
	TotalEvents   int           `json:"total_events"`
	TotalDuration time.Duration `json:"total_duration"`
	BusiestHour   int           `json:"busiest_hour"`
}

func NewCalendarCollector(baseDir string) *CalendarCollector {
	apiKey := os.Getenv("GOOGLE_CALENDAR_API_KEY")
	return &CalendarCollector{
		BaseDir: baseDir,
		APIKey:  apiKey,
	}
}

func (c *CalendarCollector) CollectTodaysEvents() error {
	now := time.Now()
	return c.collectEventsForTime(now)
}

func (c *CalendarCollector) CollectEventsForDate(dateStr string) error {
	targetDate, err := time.Parse("2006-01-02", dateStr)
	if err != nil {
		return fmt.Errorf("invalid date format '%s', expected YYYY-MM-DD: %w", dateStr, err)
	}
	return c.collectEventsForTime(targetDate)
}

func (c *CalendarCollector) collectEventsForTime(targetTime time.Time) error {
	targetDate := targetTime.Format("2006-01-02")

	fmt.Printf("Collecting Google Calendar events for %s...\n", targetDate)

	// Set up time range for the target date in JST
	jst, err := time.LoadLocation("Asia/Tokyo")
	if err != nil {
		return fmt.Errorf("failed to load JST timezone: %w", err)
	}

	// Start and end of day in JST
	startOfDay := time.Date(targetTime.Year(), targetTime.Month(), targetTime.Day(), 0, 0, 0, 0, jst)
	endOfDay := time.Date(targetTime.Year(), targetTime.Month(), targetTime.Day(), 23, 59, 59, 999999999, jst)

	// Convert to RFC3339 format for API call
	timeMin := startOfDay.Format(time.RFC3339)
	timeMax := endOfDay.Format(time.RFC3339)

	// Collect events using Google Calendar API
	events, err := c.fetchEventsFromAPI(timeMin, timeMax)
	if err != nil {
		return fmt.Errorf("failed to fetch events from Google Calendar API: %w", err)
	}

	// Check if we have any events to save
	if len(events) == 0 {
		fmt.Printf("No calendar events found for %s. No directory created.\n", targetDate)
		return nil
	}

	// Create events directory only if we have data
	eventsDir, err := c.createEventsDirectory(targetTime)
	if err != nil {
		return err
	}

	// Generate individual event files
	if err := c.saveIndividualEventFiles(eventsDir, events); err != nil {
		return err
	}

	// Generate events summary
	summary := c.generateEventsSummary(targetDate, events)
	if err := c.saveEventsSummary(eventsDir, summary); err != nil {
		return err
	}

	// Generate human-readable summary
	if err := c.saveReadableSummary(eventsDir, summary); err != nil {
		return err
	}

	fmt.Printf("Calendar events saved to: %s\n", eventsDir)
	fmt.Printf("Found %d events for %s\n", len(events), targetDate)
	return nil
}

func (c *CalendarCollector) fetchEventsFromAPI(timeMin, timeMax string) ([]CalendarEvent, error) {
	// Check if API key is available
	if c.APIKey == "" {
		return nil, fmt.Errorf("GOOGLE_CALENDAR_API_KEY environment variable is not set")
	}

	// Build request URL
	baseURL := "https://www.googleapis.com/calendar/v3/calendars/primary/events"
	params := url.Values{}
	params.Set("key", c.APIKey)
	params.Set("timeMin", timeMin)
	params.Set("timeMax", timeMax)
	params.Set("singleEvents", "true")
	params.Set("orderBy", "startTime")
	params.Set("maxResults", "100")

	requestURL := fmt.Sprintf("%s?%s", baseURL, params.Encode())

	// Make HTTP request
	resp, err := http.Get(requestURL)
	if err != nil {
		return nil, fmt.Errorf("failed to make request to Google Calendar API: %w", err)
	}
	defer resp.Body.Close()

	// Check response status
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("Google Calendar API returned error status: %d", resp.StatusCode)
	}

	// Parse JSON response
	var apiResponse GoogleCalendarResponse
	if err := json.NewDecoder(resp.Body).Decode(&apiResponse); err != nil {
		return nil, fmt.Errorf("failed to parse Google Calendar API response: %w", err)
	}

	// Convert Google Calendar events to internal format
	events := make([]CalendarEvent, 0, len(apiResponse.Items))
	for _, apiEvent := range apiResponse.Items {
		event, err := c.convertGoogleEventToInternalEvent(apiEvent)
		if err != nil {
			fmt.Printf("Warning: Failed to convert event %s: %v\n", apiEvent.ID, err)
			continue
		}
		events = append(events, event)
	}

	fmt.Printf("Found %d events from Google Calendar API\n", len(events))
	return events, nil
}

func (c *CalendarCollector) convertGoogleEventToInternalEvent(apiEvent GoogleCalendarEvent) (CalendarEvent, error) {
	var event CalendarEvent

	// Basic information
	event.ID = apiEvent.ID
	event.Summary = apiEvent.Summary
	event.Description = apiEvent.Description
	event.Location = apiEvent.Location
	event.URL = apiEvent.HtmlLink

	// Parse start time
	startTime, err := c.parseGoogleDateTime(apiEvent.Start)
	if err != nil {
		return event, fmt.Errorf("failed to parse start time: %w", err)
	}
	event.StartTime = startTime

	// Parse end time
	endTime, err := c.parseGoogleDateTime(apiEvent.End)
	if err != nil {
		return event, fmt.Errorf("failed to parse end time: %w", err)
	}
	event.EndTime = endTime

	// Process attendees
	attendees := make([]string, 0, len(apiEvent.Attendees))
	for _, attendee := range apiEvent.Attendees {
		if attendee.DisplayName != "" {
			attendees = append(attendees, fmt.Sprintf("%s (%s)", attendee.DisplayName, attendee.Email))
		} else {
			attendees = append(attendees, attendee.Email)
		}
	}
	event.Attendees = attendees

	return event, nil
}

func (c *CalendarCollector) parseGoogleDateTime(dt GoogleCalendarDateTime) (time.Time, error) {
	// Handle all-day events (date field)
	if dt.Date != "" {
		return time.Parse("2006-01-02", dt.Date)
	}

	// Handle timed events (dateTime field)
	if dt.DateTime != "" {
		return time.Parse(time.RFC3339, dt.DateTime)
	}

	return time.Time{}, fmt.Errorf("no valid date or dateTime found")
}

func (c *CalendarCollector) createEventsDirectory(date time.Time) (string, error) {
	year := fmt.Sprintf("%d", date.Year())
	dateStr := date.Format("2006-01-02")

	eventsDir := filepath.Join(c.BaseDir, "reports", year, dateStr, "calendar-events")
	if err := os.MkdirAll(eventsDir, 0755); err != nil {
		return "", fmt.Errorf("failed to create events directory %s: %w", eventsDir, err)
	}

	return eventsDir, nil
}

func (c *CalendarCollector) saveIndividualEventFiles(eventsDir string, events []CalendarEvent) error {
	for _, event := range events {
		// Create filename based on event ID and summary
		filename := c.generateEventFilename(event)
		eventFile := filepath.Join(eventsDir, filename)

		content := c.generateEventMarkdown(event)
		if err := os.WriteFile(eventFile, []byte(content), 0644); err != nil {
			return fmt.Errorf("failed to write event file %s: %w", eventFile, err)
		}
	}
	return nil
}

func (c *CalendarCollector) generateEventFilename(event CalendarEvent) string {
	// Sanitize summary for filename
	summary := strings.ReplaceAll(event.Summary, "/", "-")
	summary = strings.ReplaceAll(summary, " ", "-")
	summary = strings.ReplaceAll(summary, ":", "-")

	// Truncate if too long
	if len(summary) > 30 {
		summary = summary[:30]
	}

	// Use start time for uniqueness
	startTime := event.StartTime.In(time.FixedZone("JST", 9*3600))
	timeStr := startTime.Format("1504") // HHMM format

	return fmt.Sprintf("event-%s-%s.md", timeStr, summary)
}

func (c *CalendarCollector) generateEventMarkdown(event CalendarEvent) string {
	var content strings.Builder

	// Convert times to JST for display
	jst := time.FixedZone("JST", 9*3600)
	startJST := event.StartTime.In(jst)
	endJST := event.EndTime.In(jst)

	// Event title and basic info
	content.WriteString(fmt.Sprintf("# %s\n\n", event.Summary))

	// Time information
	content.WriteString("## 時間\n\n")
	content.WriteString(fmt.Sprintf("- **開始時刻**: %s\n", startJST.Format("15:04")))
	content.WriteString(fmt.Sprintf("- **終了時刻**: %s\n", endJST.Format("15:04")))
	content.WriteString(fmt.Sprintf("- **所要時間**: %s\n", c.formatDuration(event.EndTime.Sub(event.StartTime))))
	content.WriteString("\n")

	// Location (if available)
	if event.Location != "" {
		content.WriteString("## 場所\n\n")
		content.WriteString(fmt.Sprintf("%s\n\n", event.Location))
	}

	// Description (if available)
	if event.Description != "" {
		content.WriteString("## 詳細\n\n")
		content.WriteString(fmt.Sprintf("%s\n\n", event.Description))
	}

	// Attendees (if available)
	if len(event.Attendees) > 0 {
		content.WriteString("## 参加者\n\n")
		for _, attendee := range event.Attendees {
			content.WriteString(fmt.Sprintf("- %s\n", attendee))
		}
		content.WriteString("\n")
	}

	// Event metadata
	content.WriteString("## メタデータ\n\n")
	content.WriteString(fmt.Sprintf("- **イベントID**: %s\n", event.ID))
	if event.URL != "" {
		content.WriteString(fmt.Sprintf("- **URL**: %s\n", event.URL))
	}
	content.WriteString("\n")

	// Section for notes and learnings
	content.WriteString("## メモ・学びのポイント\n\n")
	content.WriteString("<!-- このセクションに会議での学びや重要なポイントを記録してください -->\n\n")
	content.WriteString("## アクションアイテム\n\n")
	content.WriteString("<!-- 会議で決まったタスクや次のアクションを記録してください -->\n\n")

	return content.String()
}

func (c *CalendarCollector) formatDuration(d time.Duration) string {
	hours := int(d.Hours())
	minutes := int(d.Minutes()) % 60

	if hours > 0 {
		return fmt.Sprintf("%d時間%d分", hours, minutes)
	}
	return fmt.Sprintf("%d分", minutes)
}

func (c *CalendarCollector) generateEventsSummary(date string, events []CalendarEvent) EventsSummary {
	stats := EventStats{
		TotalEvents: len(events),
	}

	var totalDuration time.Duration
	hourCounts := make(map[int]int)

	for _, event := range events {
		// Calculate duration
		duration := event.EndTime.Sub(event.StartTime)
		totalDuration += duration

		// Track busiest hour
		startHour := event.StartTime.In(time.FixedZone("JST", 9*3600)).Hour()
		hourCounts[startHour]++
	}

	stats.TotalDuration = totalDuration

	// Find busiest hour
	maxCount := 0
	for hour, count := range hourCounts {
		if count > maxCount {
			maxCount = count
			stats.BusiestHour = hour
		}
	}

	return EventsSummary{
		Date:   date,
		Events: events,
		Stats:  stats,
	}
}

func (c *CalendarCollector) saveEventsSummary(eventsDir string, summary EventsSummary) error {
	summaryFile := filepath.Join(eventsDir, "events-summary.json")

	data, err := json.MarshalIndent(summary, "", "  ")
	if err != nil {
		return fmt.Errorf("failed to marshal events summary: %w", err)
	}

	if err := os.WriteFile(summaryFile, data, 0644); err != nil {
		return fmt.Errorf("failed to write events summary file: %w", err)
	}

	return nil
}

func (c *CalendarCollector) saveReadableSummary(eventsDir string, summary EventsSummary) error {
	summaryFile := filepath.Join(eventsDir, "calendar-summary.md")

	var content strings.Builder
	content.WriteString(fmt.Sprintf("# カレンダーイベント サマリー - %s\n\n", summary.Date))

	// Statistics
	content.WriteString("## 統計情報\n\n")
	content.WriteString(fmt.Sprintf("- **総イベント数**: %d件\n", summary.Stats.TotalEvents))
	content.WriteString(fmt.Sprintf("- **総時間**: %s\n", c.formatDuration(summary.Stats.TotalDuration)))
	content.WriteString(fmt.Sprintf("- **最も忙しい時間帯**: %d時台\n", summary.Stats.BusiestHour))
	content.WriteString("\n")

	// Event list
	content.WriteString("## イベント一覧\n\n")
	if len(summary.Events) == 0 {
		content.WriteString("今日はカレンダーイベントがありませんでした。\n\n")
	} else {
		// Sort events by start time for display
		events := summary.Events
		for i := 0; i < len(events)-1; i++ {
			for j := 0; j < len(events)-1-i; j++ {
				if events[j].StartTime.After(events[j+1].StartTime) {
					events[j], events[j+1] = events[j+1], events[j]
				}
			}
		}

		for _, event := range events {
			jst := time.FixedZone("JST", 9*3600)
			startJST := event.StartTime.In(jst)
			endJST := event.EndTime.In(jst)
			filename := c.generateEventFilename(event)

			content.WriteString(fmt.Sprintf("### [%s](./%s)\n", event.Summary, filename))
			content.WriteString(fmt.Sprintf("- **時間**: %s - %s (%s)\n",
				startJST.Format("15:04"),
				endJST.Format("15:04"),
				c.formatDuration(event.EndTime.Sub(event.StartTime))))

			if event.Location != "" {
				content.WriteString(fmt.Sprintf("- **場所**: %s\n", event.Location))
			}

			if len(event.Attendees) > 0 {
				content.WriteString(fmt.Sprintf("- **参加者数**: %d名\n", len(event.Attendees)))
			}

			content.WriteString("\n")
		}
	}

	// AI Processing notes
	content.WriteString("## AI処理用メモ\n\n")
	content.WriteString("個別のイベント詳細は以下のファイルに保存されています：\n\n")
	for _, event := range summary.Events {
		filename := c.generateEventFilename(event)
		content.WriteString(fmt.Sprintf("- `%s` - %s\n", filename, event.Summary))
	}
	content.WriteString("\n")

	if err := os.WriteFile(summaryFile, []byte(content.String()), 0644); err != nil {
		return fmt.Errorf("failed to write readable summary file: %w", err)
	}

	return nil
}
