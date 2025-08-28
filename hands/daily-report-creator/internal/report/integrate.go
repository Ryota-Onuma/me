package report

import (
	"fmt"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"time"
)

// IntegrateManualWork parses manual work from comments and integrates into daily report
func IntegrateManualWork(date string) error {
	reportPath, err := getReportPath(date)
	if err != nil {
		return err
	}

	content, err := os.ReadFile(reportPath)
	if err != nil {
		return fmt.Errorf("failed to read report file: %v", err)
	}

	manualWork := extractManualWork(string(content))
	if len(manualWork) == 0 {
		fmt.Println("No manual work found in comments")
		return nil
	}

	updatedContent := integrateManualWorkContent(string(content), manualWork)

	err = os.WriteFile(reportPath, []byte(updatedContent), 0644)
	if err != nil {
		return fmt.Errorf("failed to write updated report: %v", err)
	}

	return nil
}

func getReportPath(date string) (string, error) {
	parsedDate, err := time.Parse("2006-01-02", date)
	if err != nil {
		return "", fmt.Errorf("invalid date format: %v", err)
	}

	year := parsedDate.Format("2006")
	reportDir := filepath.Join("reports", year, date)
	reportPath := filepath.Join(reportDir, "daily-report.md")

	if _, err := os.Stat(reportPath); os.IsNotExist(err) {
		return "", fmt.Errorf("daily report not found: %s", reportPath)
	}

	return reportPath, nil
}

func extractManualWork(content string) []string {
	// Extract content between <!-- and --> in the "その他の作業" section
	commentRegex := regexp.MustCompile(`<!--\s*(.*?)\s*-->`)
	matches := commentRegex.FindAllStringSubmatch(content, -1)

	var manualWork []string
	for _, match := range matches {
		if len(match) > 1 {
			lines := strings.Split(match[1], "\n")
			for _, line := range lines {
				line = strings.TrimSpace(line)
				// Skip example lines and instructions
				if line != "" && !strings.Contains(line, "例：") && !strings.Contains(line, "コピペ") {
					manualWork = append(manualWork, line)
				}
			}
		}
	}

	return manualWork
}

func integrateManualWorkContent(content string, manualWork []string) string {
	if len(manualWork) == 0 {
		return content
	}

	// Build manual work section
	manualSection := "\n### 手動で追加された作業\n"
	for _, work := range manualWork {
		if strings.HasPrefix(work, "-") {
			manualSection += work + "\n"
		} else {
			manualSection += "- " + work + "\n"
		}
	}

	// Replace the comment section with processed manual work
	commentRegex := regexp.MustCompile(`<!--[\s\S]*?-->[\s]*_手動作業の入力エリア[^\n]*\n`)
	return commentRegex.ReplaceAllString(content, manualSection)
}
