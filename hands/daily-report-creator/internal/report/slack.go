package report

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"sort"
	"strconv"
	"strings"
	"time"
)

type SlackCollector struct {
	BaseDir string
	Token   string
	UserID  string
}

type SlackMessage struct {
	Type        string         `json:"type"`
	User        string         `json:"user"`
	Text        string         `json:"text"`
	Timestamp   string         `json:"ts"`
	Channel     string         `json:"channel"`
	ChannelName string         `json:"channel_name,omitempty"`
	ThreadTS    string         `json:"thread_ts,omitempty"`
	Replies     []SlackMessage `json:"replies,omitempty"`
}

type SlackChannel struct {
	ID      string `json:"id"`
	Name    string `json:"name"`
	IsIM    bool   `json:"is_im"`
	IsMPIM  bool   `json:"is_mpim"`
	IsGroup bool   `json:"is_group"`
}

type SlackWorkSummary struct {
	Date     string         `json:"date"`
	Messages []SlackMessage `json:"messages"`
	Channels []SlackChannel `json:"channels"`
	UserID   string         `json:"user_id"`
}

type SlackAPIResponse struct {
	OK       bool              `json:"ok"`
	Messages []json.RawMessage `json:"messages"`
	Error    string            `json:"error"`
}

type SlackChannelsResponse struct {
	OK       bool           `json:"ok"`
	Channels []SlackChannel `json:"channels"`
	Error    string         `json:"error"`
}

type SlackUserResponse struct {
	OK     bool   `json:"ok"`
	UserID string `json:"user_id"`
	Error  string `json:"error"`
}

func NewSlackCollector(baseDir string) *SlackCollector {
	token := os.Getenv("SLACK_TOKEN")
	if token == "" {
		fmt.Println("Warning: SLACK_TOKEN environment variable not set")
	}

	return &SlackCollector{
		BaseDir: baseDir,
		Token:   token,
	}
}

func (s *SlackCollector) CollectTodaysWork() error {
	now := time.Now()
	return s.collectWorkForTime(now)
}

func (s *SlackCollector) CollectWorkForDate(dateStr string) error {
	// Parse date in local timezone (JST)
	loc, err := time.LoadLocation("Asia/Tokyo")
	if err != nil {
		loc = time.Local // Fallback to system local time
	}
	
	targetDate, err := time.ParseInLocation("2006-01-02", dateStr, loc)
	if err != nil {
		return fmt.Errorf("invalid date format '%s', expected YYYY-MM-DD: %w", dateStr, err)
	}
	return s.collectWorkForTime(targetDate)
}

func (s *SlackCollector) collectWorkForTime(targetTime time.Time) error {
	targetDate := targetTime.Format("2006-01-02")
	fmt.Printf("Collecting Slack activity for %s...\n", targetDate)

	if s.Token == "" {
		return fmt.Errorf("Slack token is required. Please set SLACK_TOKEN environment variable")
	}

	userID, err := s.getUserID()
	if err != nil {
		return fmt.Errorf("failed to get user ID: %w", err)
	}
	s.UserID = userID

	summary := SlackWorkSummary{
		Date:   targetDate,
		UserID: userID,
	}

	// Get all channels
	allChannels, err := s.getAllChannels()
	if err != nil {
		return fmt.Errorf("failed to get channels: %w", err)
	}

	// Get messages from all channels for the target date
	var allMessages []SlackMessage
	var activeChannels []SlackChannel
	startOfDay := time.Date(targetTime.Year(), targetTime.Month(), targetTime.Day(), 0, 0, 0, 0, targetTime.Location())
	endOfDay := startOfDay.Add(24 * time.Hour)
	
	fmt.Printf("Searching for messages between: %s and %s (JST)\n", 
		startOfDay.Format("2006-01-02 15:04:05"), 
		endOfDay.Format("2006-01-02 15:04:05"))

	for _, channel := range allChannels {
		messages, err := s.getMessagesFromChannel(channel.ID, startOfDay, endOfDay)
		if err != nil {
			fmt.Printf("Warning: Failed to get messages from channel %s: %v\n", channel.Name, err)
			continue
		}

		participatedMessages := s.getParticipatedMessages(messages, userID, channel.Name, channel.ID)
		if len(participatedMessages) > 0 {
			allMessages = append(allMessages, participatedMessages...)
			activeChannels = append(activeChannels, channel)
		}
	}

	summary.Channels = activeChannels

	// Sort messages by timestamp
	sort.Slice(allMessages, func(i, j int) bool {
		return allMessages[i].Timestamp < allMessages[j].Timestamp
	})

	summary.Messages = allMessages

	if len(allMessages) == 0 {
		fmt.Printf("No Slack messages found for %s. No directory created.\n", targetDate)
		return nil
	}

	// Create work summary directory
	workDir, err := s.createWorkDirectory(targetTime)
	if err != nil {
		return err
	}

	// Save structured data
	if err := s.saveStructuredData(workDir, summary); err != nil {
		return err
	}

	if err := s.saveReadableSummary(workDir, summary); err != nil {
		return err
	}

	// Save individual message files for AI processing
	if err := s.saveIndividualMessageFiles(workDir, summary); err != nil {
		return err
	}

	fmt.Printf("Slack activity saved to: %s\n", workDir)
	return nil
}

func (s *SlackCollector) getUserID() (string, error) {
	apiURL := "https://slack.com/api/auth.test"

	req, err := http.NewRequest("GET", apiURL, nil)
	if err != nil {
		return "", err
	}

	req.Header.Set("Authorization", "Bearer "+s.Token)

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	var userResp SlackUserResponse
	if err := json.NewDecoder(resp.Body).Decode(&userResp); err != nil {
		return "", err
	}

	if !userResp.OK {
		return "", fmt.Errorf("Slack API error: %s", userResp.Error)
	}

	return userResp.UserID, nil
}

func (s *SlackCollector) getAllChannels() ([]SlackChannel, error) {
	var allChannels []SlackChannel

	// Try to get public channels first (most basic permission)
	publicChannels, err := s.getChannelsList("conversations.list?types=public_channel&limit=1000")
	if err != nil {
		if strings.Contains(err.Error(), "missing_scope") {
			return nil, fmt.Errorf("Slack token missing basic scope. Please ensure your token has at least: channels:read, channels:history")
		}
		return nil, fmt.Errorf("failed to get public channels: %w", err)
	}
	allChannels = append(allChannels, publicChannels...)
	fmt.Printf("✅ Found %d public channels\n", len(publicChannels))

	// Try to get private channels (optional)
	privateChannels, err := s.getChannelsList("conversations.list?types=private_channel&limit=1000")
	if err != nil {
		if strings.Contains(err.Error(), "missing_scope") {
			fmt.Printf("ℹ️  Private channels skipped (missing groups:read scope)\n")
		} else {
			fmt.Printf("Warning: Failed to get private channels: %v\n", err)
		}
	} else {
		allChannels = append(allChannels, privateChannels...)
		fmt.Printf("✅ Found %d private channels\n", len(privateChannels))
	}

	// Try to get DMs and group messages (optional)
	dms, err := s.getChannelsList("conversations.list?types=mpim,im&limit=1000")
	if err != nil {
		if strings.Contains(err.Error(), "missing_scope") {
			fmt.Printf("ℹ️  DMs and group messages skipped (missing im:read, mpim:read scopes)\n")
		} else {
			fmt.Printf("Warning: Failed to get DMs: %v\n", err)
		}
	} else {
		allChannels = append(allChannels, dms...)
		fmt.Printf("✅ Found %d DMs and group messages\n", len(dms))
	}

	if len(allChannels) == 0 {
		return nil, fmt.Errorf("no channels found - check your Slack token permissions")
	}

	return allChannels, nil
}

func (s *SlackCollector) getChannelsList(endpoint string) ([]SlackChannel, error) {
	apiURL := "https://slack.com/api/" + endpoint

	req, err := http.NewRequest("GET", apiURL, nil)
	if err != nil {
		return nil, err
	}

	req.Header.Set("Authorization", "Bearer "+s.Token)

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var channelsResp SlackChannelsResponse
	if err := json.NewDecoder(resp.Body).Decode(&channelsResp); err != nil {
		return nil, err
	}

	if !channelsResp.OK {
		return nil, fmt.Errorf("Slack API error: %s", channelsResp.Error)
	}

	return channelsResp.Channels, nil
}

func (s *SlackCollector) getMessagesFromChannel(channelID string, startTime, endTime time.Time) ([]SlackMessage, error) {
	oldest := fmt.Sprintf("%.6f", float64(startTime.Unix()))
	latest := fmt.Sprintf("%.6f", float64(endTime.Unix()))

	apiURL := fmt.Sprintf("https://slack.com/api/conversations.history?channel=%s&oldest=%s&latest=%s&limit=1000",
		channelID, oldest, latest)

	req, err := http.NewRequest("GET", apiURL, nil)
	if err != nil {
		return nil, err
	}

	req.Header.Set("Authorization", "Bearer "+s.Token)

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var apiResp SlackAPIResponse
	if err := json.NewDecoder(resp.Body).Decode(&apiResp); err != nil {
		return nil, err
	}

	if !apiResp.OK {
		return nil, fmt.Errorf("Slack API error: %s", apiResp.Error)
	}

	var messages []SlackMessage
	for _, rawMessage := range apiResp.Messages {
		var msg SlackMessage
		if err := json.Unmarshal(rawMessage, &msg); err != nil {
			continue // Skip malformed messages
		}

		// Only include actual messages (not system messages)
		if msg.Type == "message" && msg.Text != "" {
			messages = append(messages, msg)
			
			// Get thread replies if this is a parent message
			if msg.ThreadTS != "" && msg.ThreadTS == msg.Timestamp {
				threadReplies, err := s.getThreadReplies(channelID, msg.ThreadTS, startTime, endTime)
				if err != nil {
					fmt.Printf("Warning: Failed to get thread replies for message %s: %v\n", msg.Timestamp, err)
				} else {
					messages = append(messages, threadReplies...)
				}
			}
		}
	}

	return messages, nil
}

func (s *SlackCollector) getThreadReplies(channelID, threadTS string, startTime, endTime time.Time) ([]SlackMessage, error) {
	oldest := fmt.Sprintf("%.6f", float64(startTime.Unix()))
	latest := fmt.Sprintf("%.6f", float64(endTime.Unix()))

	apiURL := fmt.Sprintf("https://slack.com/api/conversations.replies?channel=%s&ts=%s&oldest=%s&latest=%s&limit=1000",
		channelID, threadTS, oldest, latest)

	req, err := http.NewRequest("GET", apiURL, nil)
	if err != nil {
		return nil, err
	}

	req.Header.Set("Authorization", "Bearer "+s.Token)

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var apiResp SlackAPIResponse
	if err := json.NewDecoder(resp.Body).Decode(&apiResp); err != nil {
		return nil, err
	}

	if !apiResp.OK {
		return nil, fmt.Errorf("Slack API error: %s", apiResp.Error)
	}

	var threadMessages []SlackMessage
	for _, rawMessage := range apiResp.Messages {
		var msg SlackMessage
		if err := json.Unmarshal(rawMessage, &msg); err != nil {
			continue
		}

		// Skip the parent message (we already have it) and only include replies
		if msg.Type == "message" && msg.Text != "" && msg.Timestamp != threadTS {
			threadMessages = append(threadMessages, msg)
		}
	}

	return threadMessages, nil
}

func (s *SlackCollector) getParticipatedMessages(messages []SlackMessage, userID, channelName, channelID string) []SlackMessage {
	var participatedMessages []SlackMessage
	userParticipatedThreads := make(map[string]bool) // track threads where user participated
	
	// First pass: identify threads where user participated
	for _, msg := range messages {
		if msg.User == userID {
			if msg.ThreadTS != "" {
				userParticipatedThreads[msg.ThreadTS] = true
			} else {
				userParticipatedThreads[msg.Timestamp] = true // own thread parent
			}
		}
	}
	
	// Second pass: collect all relevant messages
	for _, msg := range messages {
		msg.ChannelName = channelName
		msg.Channel = channelID
		
		include := false
		
		// Include user's own messages
		if msg.User == userID {
			include = true
		} else {
			// Include parent messages of threads where user participated
			if msg.ThreadTS == "" && userParticipatedThreads[msg.Timestamp] {
				include = true
			}
			// Include all messages in threads where user participated
			if msg.ThreadTS != "" && userParticipatedThreads[msg.ThreadTS] {
				include = true
			}
		}
		
		if include {
			participatedMessages = append(participatedMessages, msg)
		}
	}
	
	return participatedMessages
}

func (s *SlackCollector) createWorkDirectory(date time.Time) (string, error) {
	year := fmt.Sprintf("%d", date.Year())
	dateStr := date.Format("2006-01-02")

	workDir := filepath.Join(s.BaseDir, "reports", year, dateStr, "slack-work")
	if err := os.MkdirAll(workDir, 0755); err != nil {
		return "", fmt.Errorf("failed to create work directory %s: %w", workDir, err)
	}

	return workDir, nil
}

func (s *SlackCollector) saveStructuredData(workDir string, summary SlackWorkSummary) error {
	jsonFile := filepath.Join(workDir, "slack-summary.json")

	data, err := json.MarshalIndent(summary, "", "  ")
	if err != nil {
		return fmt.Errorf("failed to marshal JSON: %w", err)
	}

	if err := os.WriteFile(jsonFile, data, 0644); err != nil {
		return fmt.Errorf("failed to write JSON file %s: %w", jsonFile, err)
	}

	return nil
}

func (s *SlackCollector) saveReadableSummary(workDir string, summary SlackWorkSummary) error {
	summaryFile := filepath.Join(workDir, "summary.md")

	var content strings.Builder
	content.WriteString(fmt.Sprintf("# Slack Activity Summary - %s\n\n", summary.Date))

	// Overview section
	content.WriteString("## Overview\n\n")
	content.WriteString(fmt.Sprintf("- **Total Messages**: %d\n", len(summary.Messages)))

	// Count channels with messages
	channelCounts := make(map[string]int)
	for _, msg := range summary.Messages {
		channelCounts[msg.ChannelName]++
	}
	content.WriteString(fmt.Sprintf("- **Active Channels**: %d\n", len(channelCounts)))
	content.WriteString("\n")

	// Channel breakdown
	content.WriteString("## Channel Activity\n\n")
	for channelName, count := range channelCounts {
		content.WriteString(fmt.Sprintf("- **%s**: %d messages\n", channelName, count))
	}
	content.WriteString("\n")

	// Message timeline
	content.WriteString("## Message Timeline\n\n")
	for _, msg := range summary.Messages {
		timestamp := s.formatTimestamp(msg.Timestamp)
		// Clean up the message text for display
		cleanText := s.cleanMessageText(msg.Text)
		content.WriteString(fmt.Sprintf("**%s** [#%s] - %s\n", timestamp, msg.ChannelName, cleanText))

		if msg.ThreadTS != "" && msg.ThreadTS != msg.Timestamp {
			content.WriteString("  ↳ (Thread reply)\n")
		}
		content.WriteString("\n")
	}

	if err := os.WriteFile(summaryFile, []byte(content.String()), 0644); err != nil {
		return fmt.Errorf("failed to write summary file %s: %w", summaryFile, err)
	}

	return nil
}

func (s *SlackCollector) saveIndividualMessageFiles(workDir string, summary SlackWorkSummary) error {
	messagesDir := filepath.Join(workDir, "messages")
	if err := os.MkdirAll(messagesDir, 0755); err != nil {
		return fmt.Errorf("failed to create messages directory: %w", err)
	}

	// Group messages by channel - include all participated messages
	channelMessages := make(map[string][]SlackMessage)
	for _, msg := range summary.Messages {
		channelMessages[msg.ChannelName] = append(channelMessages[msg.ChannelName], msg)
	}

	// Only save files for channels where user participated
	if len(channelMessages) == 0 {
		fmt.Printf("No channels with user participation to save\n")
		return nil
	}

	// Save messages by channel
	for channelName, messages := range channelMessages {
		channelFile := filepath.Join(messagesDir, fmt.Sprintf("%s.md", s.sanitizeFilename(channelName)))

		var content strings.Builder
		content.WriteString(fmt.Sprintf("# Messages from #%s - %s\n\n", channelName, summary.Date))
		content.WriteString("*ユーザーが参加した会話と関連するコンテキストメッセージ*\n\n")

		for _, msg := range messages {
			timestamp := s.formatTimestamp(msg.Timestamp)
			cleanText := s.cleanMessageText(msg.Text)

			// Mark user's own messages
			userMarker := ""
			if msg.User == summary.UserID {
				userMarker = " **[YOU]**"
			}

			content.WriteString(fmt.Sprintf("## %s%s\n\n", timestamp, userMarker))
			content.WriteString(fmt.Sprintf("%s\n\n", cleanText))

			if msg.ThreadTS != "" && msg.ThreadTS != msg.Timestamp {
				content.WriteString("*Thread reply*\n\n")
			} else if msg.ThreadTS != "" && msg.ThreadTS == msg.Timestamp {
				content.WriteString("*Thread parent*\n\n")
			}
			content.WriteString("---\n\n")
		}

		if err := os.WriteFile(channelFile, []byte(content.String()), 0644); err != nil {
			return fmt.Errorf("failed to write channel file %s: %w", channelFile, err)
		}
	}

	fmt.Printf("Saved message files for %d channels\n", len(channelMessages))
	return nil
}

func (s *SlackCollector) formatTimestamp(ts string) string {
	// Parse Slack timestamp (Unix timestamp with microseconds)
	if len(ts) < 10 {
		return ts // Return as-is if not a valid timestamp
	}

	unixTS := ts[:10] // Take first 10 digits (seconds)
	if timestamp, err := strconv.ParseInt(unixTS, 10, 64); err == nil {
		return time.Unix(timestamp, 0).Format("15:04:05")
	}

	return ts
}

func (s *SlackCollector) cleanMessageText(text string) string {
	// Remove Slack formatting and mentions
	text = strings.ReplaceAll(text, "<@", "@")
	text = strings.ReplaceAll(text, ">", "")
	text = strings.ReplaceAll(text, "&lt;", "<")
	text = strings.ReplaceAll(text, "&gt;", ">")
	text = strings.ReplaceAll(text, "&amp;", "&")

	// Don't truncate - keep full message text for context
	return text
}

func (s *SlackCollector) sanitizeFilename(filename string) string {
	// Replace invalid filename characters
	filename = strings.ReplaceAll(filename, "/", "_")
	filename = strings.ReplaceAll(filename, "\\", "_")
	filename = strings.ReplaceAll(filename, ":", "_")
	filename = strings.ReplaceAll(filename, "*", "_")
	filename = strings.ReplaceAll(filename, "?", "_")
	filename = strings.ReplaceAll(filename, "\"", "_")
	filename = strings.ReplaceAll(filename, "<", "_")
	filename = strings.ReplaceAll(filename, ">", "_")
	filename = strings.ReplaceAll(filename, "|", "_")

	return filename
}
