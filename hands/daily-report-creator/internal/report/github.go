package report

import (
	"encoding/json"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"time"
)

type GitHubCollector struct {
	BaseDir string
	Config  *RepoConfig
}

type RepoConfig struct {
	Repositories  []Repository `json:"repositories"`
	Organizations []string     `json:"organizations"`
	Settings      Settings     `json:"settings"`
}

type Repository struct {
	Owner       string `json:"owner"`
	Repo        string `json:"repo"`
	Description string `json:"description"`
}

type Settings struct {
	IncludePrivate bool     `json:"include_private"`
	MaxRepos       int      `json:"max_repos"`
	IncludePeriods []string `json:"include_periods"`
}

type PRInfo struct {
	Number    int    `json:"number"`
	Title     string `json:"title"`
	State     string `json:"state"`
	CreatedAt string `json:"createdAt"`
	UpdatedAt string `json:"updatedAt"`
	URL       string `json:"url"`
	Author    struct {
		Login string `json:"login"`
	} `json:"author"`
	Body string `json:"body"`
}

type WorkSummary struct {
	Date          string           `json:"date"`
	CreatedPRs    []PRInfo         `json:"created_prs"`
	UpdatedPRs    []PRInfo         `json:"updated_prs"`
	PRDiffs       []PRDiff         `json:"pr_diffs"`
	Conversations []PRConversation `json:"conversations"`
}

type PRDiff struct {
	PRNumber int    `json:"pr_number"`
	Title    string `json:"title"`
	Diff     string `json:"diff"`
}

type Comment struct {
	ID        interface{} `json:"id"`
	Author    string      `json:"author"`
	Body      string      `json:"body"`
	CreatedAt string      `json:"created_at"`
	UpdatedAt string      `json:"updated_at"`
	URL       string      `json:"url"`
}

type ReviewComment struct {
	ID        interface{} `json:"id"`
	Author    string      `json:"author"`
	Body      string      `json:"body"`
	Path      string      `json:"path"`
	Line      int         `json:"line"`
	CreatedAt string      `json:"created_at"`
	UpdatedAt string      `json:"updated_at"`
	DiffHunk  string      `json:"diff_hunk"`
	URL       string      `json:"url"`
}

type PRConversation struct {
	PRNumber       int             `json:"pr_number"`
	Comments       []Comment       `json:"comments"`
	ReviewComments []ReviewComment `json:"review_comments"`
}

func NewGitHubCollector(baseDir string) *GitHubCollector {
	config, err := loadRepoConfig(baseDir)
	if err != nil {
		fmt.Printf("Warning: Failed to load config, using auto-discovery: %v\n", err)
		config = nil
	}
	return &GitHubCollector{
		BaseDir: baseDir,
		Config:  config,
	}
}

func loadRepoConfig(baseDir string) (*RepoConfig, error) {
	configPath := filepath.Join(baseDir, ".github-repos.json")
	data, err := os.ReadFile(configPath)
	if err != nil {
		return nil, fmt.Errorf("failed to read config file: %w", err)
	}

	var config RepoConfig
	if err := json.Unmarshal(data, &config); err != nil {
		return nil, fmt.Errorf("failed to parse config file: %w", err)
	}

	return &config, nil
}

func (g *GitHubCollector) CollectTodaysWork() error {
	now := time.Now()
	return g.collectWorkForTime(now)
}

func (g *GitHubCollector) CollectWorkForDate(dateStr string) error {
	targetDate, err := time.Parse("2006-01-02", dateStr)
	if err != nil {
		return fmt.Errorf("invalid date format '%s', expected YYYY-MM-DD: %w", dateStr, err)
	}
	return g.collectWorkForTime(targetDate)
}

func (g *GitHubCollector) collectWorkForTime(targetTime time.Time) error {
	targetDate := targetTime.Format("2006-01-02")

	fmt.Printf("Collecting GitHub work for %s...\n", targetDate)

	// Check if gh CLI is available
	if err := g.checkGHCLI(); err != nil {
		return err
	}

	// Collect data first before creating directories
	summary := WorkSummary{
		Date: targetDate,
	}

	// Get PRs created on target date
	createdPRs, err := g.getPRsCreatedOnDate(targetDate)
	if err != nil {
		fmt.Printf("Warning: Failed to get created PRs: %v\n", err)
	} else {
		summary.CreatedPRs = createdPRs
	}

	fmt.Println(createdPRs)

	// Get PRs updated on target date
	updatedPRs, err := g.getPRsUpdatedOnDate(targetDate)
	if err != nil {
		fmt.Printf("Warning: Failed to get updated PRs: %v\n", err)
	} else {
		summary.UpdatedPRs = updatedPRs
	}

	// Check if we have any work to save
	if len(summary.CreatedPRs) == 0 && len(summary.UpdatedPRs) == 0 {
		fmt.Printf("No GitHub work found for %s. No directory created.\n", targetDate)
		return nil
	}

	// Create work summary directory only if we have data
	workDir, err := g.createWorkDirectory(targetTime)
	if err != nil {
		return err
	}

	// Get diffs for all relevant PRs
	allPRs := append(summary.CreatedPRs, summary.UpdatedPRs...)
	for _, pr := range allPRs {
		diff, err := g.getPRDiff(pr.Number, pr.URL)
		if err != nil {
			fmt.Printf("Warning: Failed to get diff for PR #%d: %v\n", pr.Number, err)
			continue
		}
		summary.PRDiffs = append(summary.PRDiffs, PRDiff{
			PRNumber: pr.Number,
			Title:    pr.Title,
			Diff:     diff,
		})

		// Get conversation history for this PR
		conversation, err := g.getPRConversation(pr.Number, pr.URL)
		if err != nil {
			fmt.Printf("Warning: Failed to get conversation for PR #%d: %v\n", pr.Number, err)
			continue
		}
		summary.Conversations = append(summary.Conversations, conversation)
	}

	// Save individual PR files for AI processing
	if err := g.savePRIndividualFiles(workDir, summary); err != nil {
		return err
	}

	// Save structured data as JSON
	if err := g.saveStructuredData(workDir, summary); err != nil {
		return err
	}

	// Save human-readable summary
	if err := g.saveReadableSummary(workDir, summary); err != nil {
		return err
	}

	fmt.Printf("Work summary saved to: %s\n", workDir)
	return nil
}

func (g *GitHubCollector) checkGHCLI() error {
	cmd := exec.Command("gh", "--version")
	if err := cmd.Run(); err != nil {
		return fmt.Errorf("GitHub CLI (gh) is not available. Please install it first")
	}
	return nil
}

func (g *GitHubCollector) createWorkDirectory(date time.Time) (string, error) {
	year := fmt.Sprintf("%d", date.Year())
	dateStr := date.Format("2006-01-02")

	workDir := filepath.Join(g.BaseDir, "reports", year, dateStr, "github-work")
	if err := os.MkdirAll(workDir, 0755); err != nil {
		return "", fmt.Errorf("failed to create work directory %s: %w", workDir, err)
	}

	return workDir, nil
}

func (g *GitHubCollector) getPRsCreatedOnDate(date string) ([]PRInfo, error) {
	// Get list of repositories to search
	repos, err := g.getUserRepositories()
	if err != nil {
		return nil, fmt.Errorf("failed to get user repositories: %w", err)
	}

	var allPRs []PRInfo
	for _, repo := range repos {
		cmd := exec.Command("gh", "pr", "list", "--state", "all",
			"--json", "number,title,state,createdAt,updatedAt,url,author,body",
			"--search", fmt.Sprintf("author:@me created:%s", date),
			"--repo", repo)

		output, err := cmd.Output()
		if err != nil {
			fmt.Printf("Warning: Failed to get created PRs from %s: %v\n", repo, err)
			continue
		}

		var prs []PRInfo
		if err := json.Unmarshal(output, &prs); err != nil {
			fmt.Printf("Warning: Failed to parse PR data from %s: %v\n", repo, err)
			continue
		}

		allPRs = append(allPRs, prs...)
	}

	return allPRs, nil
}

func (g *GitHubCollector) getPRsUpdatedOnDate(date string) ([]PRInfo, error) {
	// Get list of repositories to search
	repos, err := g.getUserRepositories()
	if err != nil {
		return nil, fmt.Errorf("failed to get user repositories: %w", err)
	}

	var allPRs []PRInfo
	for _, repo := range repos {
		cmd := exec.Command("gh", "pr", "list", "--state", "all",
			"--json", "number,title,state,createdAt,updatedAt,url,author,body",
			"--search", fmt.Sprintf("author:@me updated:%s", date),
			"--repo", repo)

		output, err := cmd.Output()
		if err != nil {
			fmt.Printf("Warning: Failed to get updated PRs from %s: %v\n", repo, err)
			continue
		}

		var prs []PRInfo
		if err := json.Unmarshal(output, &prs); err != nil {
			fmt.Printf("Warning: Failed to parse PR data from %s: %v\n", repo, err)
			continue
		}

		allPRs = append(allPRs, prs...)
	}

	return allPRs, nil
}

func (g *GitHubCollector) getUserRepositories() ([]string, error) {
	if g.Config != nil {
		// Use configured repositories
		var repoNames []string
		for _, repo := range g.Config.Repositories {
			repoNames = append(repoNames, fmt.Sprintf("%s/%s", repo.Owner, repo.Repo))
		}

		// Add organization repositories if configured
		for _, org := range g.Config.Organizations {
			orgRepos, err := g.getOrgRepositories(org)
			if err != nil {
				fmt.Printf("Warning: Failed to get repos for org %s: %v\n", org, err)
				continue
			}
			repoNames = append(repoNames, orgRepos...)
		}

		if len(repoNames) > 0 {
			return repoNames, nil
		}
	}

	// Fallback: auto-discover all user repositories
	cmd := exec.Command("gh", "repo", "list", "--json", "nameWithOwner", "--limit", "100")
	output, err := cmd.Output()
	if err != nil {
		return nil, fmt.Errorf("failed to get repositories: %w", err)
	}

	var repos []struct {
		NameWithOwner string `json:"nameWithOwner"`
	}
	if err := json.Unmarshal(output, &repos); err != nil {
		return nil, fmt.Errorf("failed to parse repository data: %w", err)
	}

	var repoNames []string
	for _, repo := range repos {
		repoNames = append(repoNames, repo.NameWithOwner)
	}

	return repoNames, nil
}

func (g *GitHubCollector) getOrgRepositories(org string) ([]string, error) {
	cmd := exec.Command("gh", "repo", "list", org, "--json", "nameWithOwner", "--limit", "100")
	output, err := cmd.Output()
	if err != nil {
		return nil, fmt.Errorf("failed to get org repositories: %w", err)
	}

	var repos []struct {
		NameWithOwner string `json:"nameWithOwner"`
	}
	if err := json.Unmarshal(output, &repos); err != nil {
		return nil, fmt.Errorf("failed to parse org repository data: %w", err)
	}

	var repoNames []string
	for _, repo := range repos {
		repoNames = append(repoNames, repo.NameWithOwner)
	}

	return repoNames, nil
}

func (g *GitHubCollector) getPRDiff(prNumber int, repoURL string) (string, error) {
	// Extract repo from URL
	parts := strings.Split(repoURL, "/")
	if len(parts) < 2 {
		return "", fmt.Errorf("invalid PR URL: %s", repoURL)
	}

	repo := fmt.Sprintf("%s/%s", parts[len(parts)-4], parts[len(parts)-3])

	cmd := exec.Command("gh", "pr", "diff", fmt.Sprintf("%d", prNumber), "--repo", repo)
	output, err := cmd.Output()
	if err != nil {
		return "", fmt.Errorf("failed to get PR diff: %w", err)
	}

	return string(output), nil
}

func (g *GitHubCollector) getPRConversation(prNumber int, repoURL string) (PRConversation, error) {
	// Extract repo from URL
	parts := strings.Split(repoURL, "/")
	if len(parts) < 2 {
		return PRConversation{}, fmt.Errorf("invalid PR URL: %s", repoURL)
	}

	repo := fmt.Sprintf("%s/%s", parts[len(parts)-4], parts[len(parts)-3])

	conversation := PRConversation{
		PRNumber: prNumber,
	}

	// Get PR comments (general comments)
	comments, err := g.getPRComments(prNumber, repo)
	if err != nil {
		fmt.Printf("Warning: Failed to get comments for PR #%d: %v\n", prNumber, err)
	} else {
		conversation.Comments = comments
	}

	// Get review comments (line-specific comments)
	reviewComments, err := g.getPRReviewComments(prNumber, repo)
	if err != nil {
		fmt.Printf("Warning: Failed to get review comments for PR #%d: %v\n", prNumber, err)
	} else {
		conversation.ReviewComments = reviewComments
	}

	return conversation, nil
}

func (g *GitHubCollector) getPRComments(prNumber int, repo string) ([]Comment, error) {
	cmd := exec.Command("gh", "pr", "view", fmt.Sprintf("%d", prNumber), "--repo", repo,
		"--json", "comments", "--jq", ".comments[]")

	output, err := cmd.Output()
	if err != nil {
		return nil, fmt.Errorf("failed to get PR comments: %w", err)
	}

	if strings.TrimSpace(string(output)) == "" {
		return []Comment{}, nil
	}

	lines := strings.Split(strings.TrimSpace(string(output)), "\n")
	var comments []Comment

	for _, line := range lines {
		if strings.TrimSpace(line) == "" {
			continue
		}

		var rawComment struct {
			ID     interface{} `json:"id"`
			Author struct {
				Login string `json:"login"`
			} `json:"author"`
			Body      string `json:"body"`
			CreatedAt string `json:"createdAt"`
			UpdatedAt string `json:"updatedAt"`
			URL       string `json:"url"`
		}

		if err := json.Unmarshal([]byte(line), &rawComment); err != nil {
			fmt.Printf("Warning: Failed to parse comment: %v\n", err)
			continue
		}

		var commentID int
		switch id := rawComment.ID.(type) {
		case int:
			commentID = id
		case float64:
			commentID = int(id)
		default:
			commentID = 0
		}

		comments = append(comments, Comment{
			ID:        commentID,
			Author:    rawComment.Author.Login,
			Body:      rawComment.Body,
			CreatedAt: rawComment.CreatedAt,
			UpdatedAt: rawComment.UpdatedAt,
			URL:       rawComment.URL,
		})
	}

	return comments, nil
}

func (g *GitHubCollector) getPRReviewComments(prNumber int, repo string) ([]ReviewComment, error) {
	// Get review comments using gh api command
	cmd := exec.Command("gh", "api", fmt.Sprintf("repos/%s/pulls/%d/comments", repo, prNumber),
		"--jq", ".[]")

	output, err := cmd.Output()
	if err != nil {
		return nil, fmt.Errorf("failed to get review comments: %w", err)
	}

	if strings.TrimSpace(string(output)) == "" {
		return []ReviewComment{}, nil
	}

	lines := strings.Split(strings.TrimSpace(string(output)), "\n")
	var reviewComments []ReviewComment

	for _, line := range lines {
		if strings.TrimSpace(line) == "" {
			continue
		}

		var rawComment struct {
			ID   interface{} `json:"id"`
			User struct {
				Login string `json:"login"`
			} `json:"user"`
			Body      string `json:"body"`
			Path      string `json:"path"`
			Line      int    `json:"line"`
			CreatedAt string `json:"created_at"`
			UpdatedAt string `json:"updated_at"`
			DiffHunk  string `json:"diff_hunk"`
			HTMLURL   string `json:"html_url"`
		}

		if err := json.Unmarshal([]byte(line), &rawComment); err != nil {
			fmt.Printf("Warning: Failed to parse review comment: %v\n", err)
			continue
		}

		var reviewCommentID int
		switch id := rawComment.ID.(type) {
		case int:
			reviewCommentID = id
		case float64:
			reviewCommentID = int(id)
		default:
			reviewCommentID = 0
		}

		reviewComments = append(reviewComments, ReviewComment{
			ID:        reviewCommentID,
			Author:    rawComment.User.Login,
			Body:      rawComment.Body,
			Path:      rawComment.Path,
			Line:      rawComment.Line,
			CreatedAt: rawComment.CreatedAt,
			UpdatedAt: rawComment.UpdatedAt,
			DiffHunk:  rawComment.DiffHunk,
			URL:       rawComment.HTMLURL,
		})
	}

	return reviewComments, nil
}

func (g *GitHubCollector) savePRIndividualFiles(workDir string, summary WorkSummary) error {
	// Create individual directories for each PR
	allPRs := append(summary.CreatedPRs, summary.UpdatedPRs...)

	for _, pr := range allPRs {
		// Extract repository name from URL
		repoName := g.extractRepoFromURL(pr.URL)
		prDirName := fmt.Sprintf("pr-%d-%s", pr.Number, repoName)
		prDir := filepath.Join(workDir, prDirName)

		if err := os.MkdirAll(prDir, 0755); err != nil {
			return fmt.Errorf("failed to create PR directory %s: %w", prDir, err)
		}

		// Save metadata
		if err := g.savePRMetadata(prDir, pr); err != nil {
			return fmt.Errorf("failed to save metadata for PR #%d: %w", pr.Number, err)
		}

		// Save description
		if err := g.savePRDescription(prDir, pr); err != nil {
			return fmt.Errorf("failed to save description for PR #%d: %w", pr.Number, err)
		}

		// Save diff if available
		if err := g.savePRDiff(prDir, pr, summary.PRDiffs); err != nil {
			return fmt.Errorf("failed to save diff for PR #%d: %w", pr.Number, err)
		}

		// Save conversation history if available
		if err := g.savePRConversation(prDir, pr, summary.Conversations); err != nil {
			return fmt.Errorf("failed to save conversation for PR #%d: %w", pr.Number, err)
		}
	}

	return nil
}

func (g *GitHubCollector) extractRepoFromURL(url string) string {
	parts := strings.Split(url, "/")
	if len(parts) >= 2 {
		return parts[len(parts)-3] // Repository name from GitHub URL
	}
	return "unknown-repo"
}

func (g *GitHubCollector) savePRMetadata(prDir string, pr PRInfo) error {
	metadataFile := filepath.Join(prDir, "metadata.json")

	metadata := map[string]interface{}{
		"number":     pr.Number,
		"title":      pr.Title,
		"state":      pr.State,
		"url":        pr.URL,
		"author":     pr.Author.Login,
		"created_at": pr.CreatedAt,
		"updated_at": pr.UpdatedAt,
		"repository": g.extractRepoFromURL(pr.URL),
	}

	data, err := json.MarshalIndent(metadata, "", "  ")
	if err != nil {
		return fmt.Errorf("failed to marshal metadata: %w", err)
	}

	if err := os.WriteFile(metadataFile, data, 0644); err != nil {
		return fmt.Errorf("failed to write metadata file: %w", err)
	}

	return nil
}

func (g *GitHubCollector) savePRDescription(prDir string, pr PRInfo) error {
	descFile := filepath.Join(prDir, "description.md")

	var content strings.Builder
	content.WriteString(fmt.Sprintf("# PR #%d: %s\n\n", pr.Number, pr.Title))
	content.WriteString(fmt.Sprintf("**Repository**: %s\n", g.extractRepoFromURL(pr.URL)))
	content.WriteString(fmt.Sprintf("**Author**: %s\n", pr.Author.Login))
	content.WriteString(fmt.Sprintf("**State**: %s\n", pr.State))
	content.WriteString(fmt.Sprintf("**Created**: %s\n", pr.CreatedAt))
	content.WriteString(fmt.Sprintf("**Updated**: %s\n", pr.UpdatedAt))
	content.WriteString(fmt.Sprintf("**URL**: %s\n\n", pr.URL))

	if pr.Body != "" {
		content.WriteString("## Description\n\n")
		content.WriteString(pr.Body)
		content.WriteString("\n\n")
	}

	if err := os.WriteFile(descFile, []byte(content.String()), 0644); err != nil {
		return fmt.Errorf("failed to write description file: %w", err)
	}

	return nil
}

func (g *GitHubCollector) savePRDiff(prDir string, pr PRInfo, diffs []PRDiff) error {
	// Find the diff for this PR
	var prDiff string
	for _, diff := range diffs {
		if diff.PRNumber == pr.Number {
			prDiff = diff.Diff
			break
		}
	}

	if prDiff == "" {
		// Create a placeholder file indicating no diff available
		placeholderFile := filepath.Join(prDir, "diff-unavailable.txt")
		content := fmt.Sprintf("Diff not available for PR #%d\nThis could be due to permissions or the PR may not have changes.", pr.Number)
		return os.WriteFile(placeholderFile, []byte(content), 0644)
	}

	diffFile := filepath.Join(prDir, "diff.patch")
	if err := os.WriteFile(diffFile, []byte(prDiff), 0644); err != nil {
		return fmt.Errorf("failed to write diff file: %w", err)
	}

	return nil
}

func (g *GitHubCollector) savePRConversation(prDir string, pr PRInfo, conversations []PRConversation) error {
	// Find the conversation for this PR
	var prConversation PRConversation
	found := false
	for _, conv := range conversations {
		if conv.PRNumber == pr.Number {
			prConversation = conv
			found = true
			break
		}
	}

	if !found {
		// Create a placeholder file indicating no conversation available
		placeholderFile := filepath.Join(prDir, "conversation-unavailable.txt")
		content := fmt.Sprintf("Conversation not available for PR #%d\nThis could be due to permissions or no comments exist.", pr.Number)
		return os.WriteFile(placeholderFile, []byte(content), 0644)
	}

	// Save structured conversation data as JSON
	conversationFile := filepath.Join(prDir, "conversation.json")
	data, err := json.MarshalIndent(prConversation, "", "  ")
	if err != nil {
		return fmt.Errorf("failed to marshal conversation: %w", err)
	}

	if err := os.WriteFile(conversationFile, data, 0644); err != nil {
		return fmt.Errorf("failed to write conversation file: %w", err)
	}

	// Save human-readable conversation
	if err := g.saveReadableConversation(prDir, prConversation); err != nil {
		return fmt.Errorf("failed to save readable conversation: %w", err)
	}

	return nil
}

func (g *GitHubCollector) saveReadableConversation(prDir string, conversation PRConversation) error {
	conversationFile := filepath.Join(prDir, "conversation.md")

	var content strings.Builder
	content.WriteString(fmt.Sprintf("# Conversation History - PR #%d\n\n", conversation.PRNumber))

	// General comments
	if len(conversation.Comments) > 0 {
		content.WriteString("## General Comments\n\n")
		for _, comment := range conversation.Comments {
			content.WriteString(fmt.Sprintf("### Comment by @%s\n", comment.Author))
			content.WriteString(fmt.Sprintf("**Posted**: %s\n", comment.CreatedAt))
			if comment.UpdatedAt != comment.CreatedAt {
				content.WriteString(fmt.Sprintf("**Updated**: %s\n", comment.UpdatedAt))
			}
			content.WriteString(fmt.Sprintf("**URL**: %s\n\n", comment.URL))
			content.WriteString("**Content**:\n")
			content.WriteString(comment.Body)
			content.WriteString("\n\n---\n\n")
		}
	} else {
		content.WriteString("## General Comments\n\nNo general comments found.\n\n")
	}

	// Review comments (line-specific)
	if len(conversation.ReviewComments) > 0 {
		content.WriteString("## Review Comments (Code-specific)\n\n")
		for _, comment := range conversation.ReviewComments {
			content.WriteString(fmt.Sprintf("### Review Comment by @%s\n", comment.Author))
			content.WriteString(fmt.Sprintf("**File**: %s (Line %d)\n", comment.Path, comment.Line))
			content.WriteString(fmt.Sprintf("**Posted**: %s\n", comment.CreatedAt))
			if comment.UpdatedAt != comment.CreatedAt {
				content.WriteString(fmt.Sprintf("**Updated**: %s\n", comment.UpdatedAt))
			}
			content.WriteString(fmt.Sprintf("**URL**: %s\n\n", comment.URL))

			if comment.DiffHunk != "" {
				content.WriteString("**Code Context**:\n")
				content.WriteString("```diff\n")
				content.WriteString(comment.DiffHunk)
				content.WriteString("\n```\n\n")
			}

			content.WriteString("**Comment**:\n")
			content.WriteString(comment.Body)
			content.WriteString("\n\n---\n\n")
		}
	} else {
		content.WriteString("## Review Comments (Code-specific)\n\nNo review comments found.\n\n")
	}

	if err := os.WriteFile(conversationFile, []byte(content.String()), 0644); err != nil {
		return fmt.Errorf("failed to write conversation file: %w", err)
	}

	return nil
}

func (g *GitHubCollector) saveStructuredData(workDir string, summary WorkSummary) error {
	jsonFile := filepath.Join(workDir, "work-summary.json")

	data, err := json.MarshalIndent(summary, "", "  ")
	if err != nil {
		return fmt.Errorf("failed to marshal JSON: %w", err)
	}

	if err := os.WriteFile(jsonFile, data, 0644); err != nil {
		return fmt.Errorf("failed to write JSON file %s: %w", jsonFile, err)
	}

	return nil
}

func (g *GitHubCollector) saveReadableSummary(workDir string, summary WorkSummary) error {
	summaryFile := filepath.Join(workDir, "summary.md")

	var content strings.Builder
	content.WriteString(fmt.Sprintf("# GitHub Work Summary - %s\n\n", summary.Date))

	// Overview section for AI context
	content.WriteString("## Overview\n\n")
	content.WriteString(fmt.Sprintf("- **Total PRs Created**: %d\n", len(summary.CreatedPRs)))
	content.WriteString(fmt.Sprintf("- **Total PRs Updated**: %d\n", len(summary.UpdatedPRs)))
	content.WriteString(fmt.Sprintf("- **Total Code Changes**: %d\n", len(summary.PRDiffs)))
	content.WriteString(fmt.Sprintf("- **Total Conversations**: %d\n", len(summary.Conversations)))
	content.WriteString("\n")

	// Directory structure for AI reference
	content.WriteString("## AI Processing Notes\n\n")
	content.WriteString("Individual PR details are stored in subdirectories for AI analysis:\n\n")

	allPRs := append(summary.CreatedPRs, summary.UpdatedPRs...)
	for _, pr := range allPRs {
		repoName := g.extractRepoFromURL(pr.URL)
		prDirName := fmt.Sprintf("pr-%d-%s", pr.Number, repoName)
		content.WriteString(fmt.Sprintf("- `%s/` - PR #%d: %s\n", prDirName, pr.Number, pr.Title))
		content.WriteString(fmt.Sprintf("  - `metadata.json` - Structured PR metadata\n"))
		content.WriteString(fmt.Sprintf("  - `description.md` - PR description and details\n"))
		content.WriteString(fmt.Sprintf("  - `diff.patch` - Code changes (if available)\n"))
		content.WriteString(fmt.Sprintf("  - `conversation.json` - Structured conversation data\n"))
		content.WriteString(fmt.Sprintf("  - `conversation.md` - Human-readable conversation history\n"))
	}
	content.WriteString("\n")

	// Created PRs section (simplified)
	content.WriteString("## Created PRs\n\n")
	if len(summary.CreatedPRs) == 0 {
		content.WriteString("No PRs created today.\n\n")
	} else {
		for _, pr := range summary.CreatedPRs {
			repoName := g.extractRepoFromURL(pr.URL)
			content.WriteString(fmt.Sprintf("### [PR #%d](./%s/description.md): %s\n", pr.Number, fmt.Sprintf("pr-%d-%s", pr.Number, repoName), pr.Title))
			content.WriteString(fmt.Sprintf("- **Repository**: %s\n", repoName))
			content.WriteString(fmt.Sprintf("- **State**: %s\n", pr.State))
			content.WriteString(fmt.Sprintf("- **URL**: %s\n", pr.URL))
			content.WriteString(fmt.Sprintf("- **Created**: %s\n", pr.CreatedAt))
			content.WriteString("\n")
		}
	}

	// Updated PRs section (simplified)
	content.WriteString("## Updated PRs\n\n")
	if len(summary.UpdatedPRs) == 0 {
		content.WriteString("No PRs updated today.\n\n")
	} else {
		for _, pr := range summary.UpdatedPRs {
			repoName := g.extractRepoFromURL(pr.URL)
			content.WriteString(fmt.Sprintf("### [PR #%d](./%s/description.md): %s\n", pr.Number, fmt.Sprintf("pr-%d-%s", pr.Number, repoName), pr.Title))
			content.WriteString(fmt.Sprintf("- **Repository**: %s\n", repoName))
			content.WriteString(fmt.Sprintf("- **State**: %s\n", pr.State))
			content.WriteString(fmt.Sprintf("- **URL**: %s\n", pr.URL))
			content.WriteString(fmt.Sprintf("- **Updated**: %s\n", pr.UpdatedAt))
			content.WriteString("\n")
		}
	}

	if err := os.WriteFile(summaryFile, []byte(content.String()), 0644); err != nil {
		return fmt.Errorf("failed to write summary file %s: %w", summaryFile, err)
	}

	return nil
}
