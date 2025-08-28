package report

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"time"
)

type Generator struct {
	BaseDir string
}

func NewGenerator(baseDir string) *Generator {
	return &Generator{
		BaseDir: baseDir,
	}
}

func (g *Generator) CreateDailyReport() error {
	return g.createDailyReportForTime(time.Now())
}

func (g *Generator) CreateDailyReportForDate(dateStr string) error {
	targetDate, err := time.Parse("2006-01-02", dateStr)
	if err != nil {
		return fmt.Errorf("invalid date format '%s', expected YYYY-MM-DD: %w", dateStr, err)
	}
	return g.createDailyReportForTime(targetDate)
}

func (g *Generator) createDailyReportForTime(targetTime time.Time) error {
	year := fmt.Sprintf("%d", targetTime.Year())
	date := targetTime.Format("2006-01-02")

	reportDir := filepath.Join(g.BaseDir, "reports", year, date)
	if err := os.MkdirAll(reportDir, 0755); err != nil {
		return fmt.Errorf("failed to create directory %s: %w", reportDir, err)
	}

	reportFile := filepath.Join(reportDir, "daily-report.md")
	if _, err := os.Stat(reportFile); err == nil {
		fmt.Printf("Daily report already exists: %s\n", reportFile)
		return nil
	}

	content := g.generateReportTemplate(targetTime)

	if err := os.WriteFile(reportFile, []byte(content), 0644); err != nil {
		return fmt.Errorf("failed to write report file %s: %w", reportFile, err)
	}

	manualDraftFile := filepath.Join(reportDir, "manual-draft.md")
	if _, err := os.Stat(manualDraftFile); os.IsNotExist(err) {
		manualDraftContent := g.generateManualDraftTemplate(targetTime)
		if err := os.WriteFile(manualDraftFile, []byte(manualDraftContent), 0644); err != nil {
			return fmt.Errorf("failed to write manual draft file %s: %w", manualDraftFile, err)
		}
		fmt.Printf("Manual draft created: %s\n", manualDraftFile)
	}

	fmt.Printf("Daily report created: %s\n", reportFile)
	return nil
}

func (g *Generator) generateReportTemplate(date time.Time) string {
	dateStr := date.Format("2006年01月02日")
	weekday := []string{"日", "月", "火", "水", "木", "金", "土"}[date.Weekday()]

	return fmt.Sprintf(`# 日報 - %s (%s曜日)

## 今日の主な成果

- 

## 技術的な作業内容

### GitHub作業

<!-- GitHub作業はここに自動的に挿入されます -->

## 学んだこと・気づき

- 

## 直面した課題と解決策

- 

## その他の作業

## 明日以降の予定

- 

`, dateStr, weekday)
}

func (g *Generator) generateManualDraftTemplate(date time.Time) string {
	dateStr := date.Format("2006年01月02日")
	weekday := []string{"日", "月", "火", "水", "木", "金", "土"}[date.Weekday()]

	return fmt.Sprintf(`# 手動作業ドラフト - %s (%s曜日)

このファイルに今日の作業内容を自由に記入してください。
後で日報に統合する際の下書きとして使用できます。
`, dateStr, weekday)
}

// IntegrateGitHubWork integrates GitHub work data into the daily report
func (g *Generator) IntegrateGitHubWork(dateStr string) error {
	year := dateStr[:4]
	reportFile := filepath.Join(g.BaseDir, "reports", year, dateStr, "daily-report.md")
	githubWorkDir := filepath.Join(g.BaseDir, "reports", year, dateStr, "github-work")

	// Check if report file exists
	if _, err := os.Stat(reportFile); os.IsNotExist(err) {
		return fmt.Errorf("daily report file not found: %s", reportFile)
	}

	// Check if GitHub work directory exists
	if _, err := os.Stat(githubWorkDir); os.IsNotExist(err) {
		fmt.Printf("No GitHub work data found for %s, skipping integration\n", dateStr)
		return nil
	}

	content, err := os.ReadFile(reportFile)
	if err != nil {
		return fmt.Errorf("failed to read report file: %w", err)
	}
	githubContent, err := g.generateGitHubWorkContent(githubWorkDir)
	if err != nil {
		return fmt.Errorf("failed to generate GitHub work content: %w", err)
	}

	updatedContent := strings.Replace(
		string(content),
		"<!-- GitHub作業はここに自動的に挿入されます -->",
		githubContent,
		1,
	)
	if err := os.WriteFile(reportFile, []byte(updatedContent), 0644); err != nil {
		return fmt.Errorf("failed to write updated report file: %w", err)
	}

	fmt.Printf("GitHub work integrated into daily report: %s\n", reportFile)
	return nil
}

func (g *Generator) generateGitHubWorkContent(githubWorkDir string) (string, error) {
	var content strings.Builder

	summaryFile := filepath.Join(githubWorkDir, "work-summary.json")
	var workSummary WorkSummary

	if summaryData, err := os.ReadFile(summaryFile); err == nil {
		if err := json.Unmarshal(summaryData, &workSummary); err != nil {
			return "", fmt.Errorf("failed to parse work summary: %w", err)
		}
	} else {
		return "今日はGitHub作業がありませんでした。", nil
	}

	if len(workSummary.CreatedPRs) == 0 && len(workSummary.UpdatedPRs) == 0 {
		return "今日はGitHub作業がありませんでした。", nil
	}

	if len(workSummary.CreatedPRs) > 0 {
		content.WriteString("### PR作成\n\n")
		for _, pr := range workSummary.CreatedPRs {
			prContent, err := g.generatePRContent(githubWorkDir, pr, "作成")
			if err != nil {
				fmt.Printf("Warning: Failed to generate content for created PR #%d: %v\n", pr.Number, err)
				continue
			}
			content.WriteString(prContent)
		}
	}

	if len(workSummary.UpdatedPRs) > 0 {
		content.WriteString("### PR更新\n\n")
		for _, pr := range workSummary.UpdatedPRs {
			skip := false
			for _, createdPR := range workSummary.CreatedPRs {
				if createdPR.Number == pr.Number {
					skip = true
					break
				}
			}
			if skip {
				continue
			}

			prContent, err := g.generatePRContent(githubWorkDir, pr, "更新")
			if err != nil {
				fmt.Printf("Warning: Failed to generate content for updated PR #%d: %v\n", pr.Number, err)
				continue
			}
			content.WriteString(prContent)
		}
	}

	return content.String(), nil
}

func (g *Generator) generatePRContent(githubWorkDir string, pr PRInfo, action string) (string, error) {
	var content strings.Builder

	repoName := g.extractRepoFromURL(pr.URL)
	prDir := filepath.Join(githubWorkDir, fmt.Sprintf("pr-%d-%s", pr.Number, repoName))

	content.WriteString(fmt.Sprintf("#### [PR #%d: %s](%s) (%s)\n\n", pr.Number, pr.Title, pr.URL, action))
	content.WriteString(fmt.Sprintf("**リポジトリ**: %s  \n", repoName))
	content.WriteString(fmt.Sprintf("**ステータス**: %s  \n\n", pr.State))

	// Add PR description if available
	if pr.Body != "" {
		content.WriteString("**概要**:\n")
		content.WriteString(pr.Body)
		content.WriteString("\n\n")
	}

	diffFile := filepath.Join(prDir, "diff.patch")
	if diffData, err := os.ReadFile(diffFile); err == nil && len(diffData) > 0 {
		insights := g.analyzeDiffForInsights(string(diffData))
		if insights != "" {
			content.WriteString("**実装内容**:\n")
			content.WriteString(insights)
			content.WriteString("\n\n")
		}
	}

	conversationFile := filepath.Join(prDir, "conversation.json")
	if convData, err := os.ReadFile(conversationFile); err == nil {
		var conversation PRConversation
		if err := json.Unmarshal(convData, &conversation); err == nil {
			insights := g.analyzeConversationForInsights(conversation)
			if insights != "" {
				content.WriteString("**議論・学習ポイント**:\n")
				content.WriteString(insights)
				content.WriteString("\n\n")
			}
		}
	}

	content.WriteString("---\n\n")
	return content.String(), nil
}

func (g *Generator) analyzeDiffForInsights(diff string) string {
	if diff == "" {
		return ""
	}

	var insights []string
	lines := strings.Split(diff, "\n")

	// Count changes
	addedLines := 0
	removedLines := 0
	modifiedFiles := make(map[string]bool)

	for _, line := range lines {
		if strings.HasPrefix(line, "+++") || strings.HasPrefix(line, "---") {
			// Extract file path
			if strings.HasPrefix(line, "+++") && !strings.Contains(line, "/dev/null") {
				parts := strings.Fields(line)
				if len(parts) > 1 {
					filePath := strings.TrimPrefix(parts[1], "b/")
					modifiedFiles[filePath] = true
				}
			}
		} else if strings.HasPrefix(line, "+") && !strings.HasPrefix(line, "+++") {
			addedLines++
		} else if strings.HasPrefix(line, "-") && !strings.HasPrefix(line, "---") {
			removedLines++
		}
	}

	if len(modifiedFiles) > 0 {
		fileList := make([]string, 0, len(modifiedFiles))
		for file := range modifiedFiles {
			fileList = append(fileList, file)
		}
		insights = append(insights, fmt.Sprintf("- 変更ファイル: %s", strings.Join(fileList, ", ")))
	}

	if addedLines > 0 || removedLines > 0 {
		insights = append(insights, fmt.Sprintf("- 変更量: +%d行, -%d行", addedLines, removedLines))
	}

	// Analyze file types and technologies
	technologies := g.detectTechnologies(modifiedFiles)
	if len(technologies) > 0 {
		insights = append(insights, fmt.Sprintf("- 技術要素: %s", strings.Join(technologies, ", ")))
	}

	if len(insights) > 0 {
		return strings.Join(insights, "\n")
	}

	return ""
}

func (g *Generator) detectTechnologies(files map[string]bool) []string {
	techMap := make(map[string]bool)

	for file := range files {
		ext := strings.ToLower(filepath.Ext(file))
		switch ext {
		case ".go":
			techMap["Go"] = true
		case ".js", ".jsx":
			techMap["JavaScript"] = true
		case ".ts", ".tsx":
			techMap["TypeScript"] = true
		case ".py":
			techMap["Python"] = true
		case ".java":
			techMap["Java"] = true
		case ".rs":
			techMap["Rust"] = true
		case ".cpp", ".cc", ".cxx":
			techMap["C++"] = true
		case ".c":
			techMap["C"] = true
		case ".rb":
			techMap["Ruby"] = true
		case ".php":
			techMap["PHP"] = true
		case ".html":
			techMap["HTML"] = true
		case ".css":
			techMap["CSS"] = true
		case ".sql":
			techMap["SQL"] = true
		case ".yml", ".yaml":
			techMap["YAML"] = true
		case ".json":
			techMap["JSON"] = true
		case ".md":
			techMap["Markdown"] = true
		case ".sh":
			techMap["Shell Script"] = true
		case ".dockerfile":
			techMap["Docker"] = true
		}

		// Check for specific frameworks/tools in file paths
		if strings.Contains(file, "package.json") {
			techMap["Node.js"] = true
		}
		if strings.Contains(file, "go.mod") || strings.Contains(file, "go.sum") {
			techMap["Go Modules"] = true
		}
		if strings.Contains(file, "Cargo.toml") {
			techMap["Cargo (Rust)"] = true
		}
		if strings.Contains(file, "requirements.txt") {
			techMap["pip (Python)"] = true
		}
	}

	var technologies []string
	for tech := range techMap {
		technologies = append(technologies, tech)
	}

	return technologies
}

func (g *Generator) analyzeConversationForInsights(conversation PRConversation) string {
	var insights []string

	// Analyze general comments
	for _, comment := range conversation.Comments {
		if comment.Body != "" {
			body := strings.ToLower(comment.Body)
			if strings.Contains(body, "learn") || strings.Contains(body, "学") {
				insights = append(insights, "- 学習に関する議論がありました")
				break
			}
		}
	}

	hasCodeReview := len(conversation.ReviewComments) > 0
	if hasCodeReview {
		insights = append(insights, fmt.Sprintf("- コードレビュー: %d件のコメント", len(conversation.ReviewComments)))

		// Look for patterns in review comments
		for _, comment := range conversation.ReviewComments {
			body := strings.ToLower(comment.Body)
			if strings.Contains(body, "performance") || strings.Contains(body, "optimize") {
				insights = append(insights, "- パフォーマンスに関する議論")
				break
			}
			if strings.Contains(body, "security") || strings.Contains(body, "secure") {
				insights = append(insights, "- セキュリティに関する議論")
				break
			}
			if strings.Contains(body, "test") || strings.Contains(body, "テスト") {
				insights = append(insights, "- テストに関する議論")
				break
			}
		}
	}

	if len(insights) > 0 {
		return strings.Join(insights, "\n")
	}

	return ""
}

func (g *Generator) extractRepoFromURL(url string) string {
	parts := strings.Split(url, "/")
	if len(parts) >= 2 {
		return parts[len(parts)-3] // Repository name from GitHub URL
	}
	return "unknown-repo"
}
