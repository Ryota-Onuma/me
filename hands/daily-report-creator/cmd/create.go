package cmd

import (
	"daily-report-creator/internal/report"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"os"
	"path/filepath"
	"strings"
	"time"
)

var createCmd = &Command{
	Name:  "create",
	Short: "Create a new daily report",
	Long:  "Create a new daily report markdown file in the reports directory organized by year and date. Accepts date in YYYY-MM-DD format, uses today's date if not provided.",
	Run: func(cmd *Command, args []string) error {
		date := time.Now().Format("2006-01-02")
		if len(args) > 0 {
			date = args[0]
		}

		fmt.Printf("📅 Creating daily report for %s...\n", date)

		// Create the base daily report
		generator := report.NewGenerator(".")
		var err error
		if len(args) > 0 {
			err = generator.CreateDailyReportForDate(args[0])
		} else {
			err = generator.CreateDailyReport()
		}
		if err != nil {
			return fmt.Errorf("failed to create daily report: %v", err)
		}

		fmt.Printf("✅ Daily report created successfully!\n")
		fmt.Printf("💡 Run 'go run main.go fetch-github-activity %s' to collect GitHub activity\n", date)
		fmt.Printf("💡 Run 'go run main.go fetch-slack-activity %s' to collect Slack activity\n", date)
		return nil
	},
}

type PRAnalyzer struct {
	basePath string
}

type PRMetadata struct {
	Author     string `json:"author"`
	CreatedAt  string `json:"created_at"`
	Number     int    `json:"number"`
	Repository string `json:"repository"`
	State      string `json:"state"`
	Title      string `json:"title"`
	UpdatedAt  string `json:"updated_at"`
	URL        string `json:"url"`
}

type PRAnalysis struct {
	Metadata          PRMetadata
	Description       string
	DiffPatch         string
	TechnicalAnalysis TechnicalAnalysis
	BusinessImpact    BusinessImpact
	LearningPoints    []string
	ReviewComments    []string
	ActionItems       []string
}

type TechnicalAnalysis struct {
	FilesChanged       []string
	LinesAdded         int
	LinesRemoved       int
	Complexity         string
	ArchitecturalNotes []string
	CodeQuality        []string
	TestCoverage       string
}

type BusinessImpact struct {
	FeatureCategory   string
	UserImpact        string
	MaintenanceImpact string
	PerformanceImpact string
	SecurityImpact    string
}

func NewPRAnalyzer(basePath string) *PRAnalyzer {
	return &PRAnalyzer{basePath: basePath}
}

func (p *PRAnalyzer) AnalyzeTodaysPRs(date string) error {
	year := date[:4]
	githubWorkDir := filepath.Join(p.basePath, "reports", year, date, "github-work")

	if _, err := os.Stat(githubWorkDir); os.IsNotExist(err) {
		return fmt.Errorf("no GitHub work found for %s", date)
	}

	dirs, err := ioutil.ReadDir(githubWorkDir)
	if err != nil {
		return fmt.Errorf("failed to read GitHub work directory: %v", err)
	}

	prCount := 0
	for _, dir := range dirs {
		if !dir.IsDir() || !strings.HasPrefix(dir.Name(), "pr-") {
			continue
		}

		prCount++
		fmt.Printf("════════════════════════════════════════════════════════════════════════════════\n")
		fmt.Printf("                              PR ANALYSIS #%d                                   \n", prCount)
		fmt.Printf("════════════════════════════════════════════════════════════════════════════════\n\n")

		analysis, err := p.analyzeSinglePR(filepath.Join(githubWorkDir, dir.Name()))
		if err != nil {
			fmt.Printf("❌ Error analyzing %s: %v\n\n", dir.Name(), err)
			continue
		}

		p.displayPRAnalysis(analysis)
		fmt.Printf("\n")
	}

	if prCount == 0 {
		fmt.Println("📭 No PRs found for analysis today.")
		return nil
	}

	fmt.Printf("📊 Total PRs analyzed: %d\n", prCount)
	return nil
}

func (p *PRAnalyzer) analyzeSinglePR(prDir string) (*PRAnalysis, error) {
	analysis := &PRAnalysis{}

	// Load metadata
	metadataPath := filepath.Join(prDir, "metadata.json")
	if err := p.loadMetadata(metadataPath, &analysis.Metadata); err != nil {
		return nil, fmt.Errorf("failed to load metadata: %v", err)
	}

	// Load description
	descPath := filepath.Join(prDir, "description.md")
	if desc, err := ioutil.ReadFile(descPath); err == nil {
		analysis.Description = string(desc)
	}

	// Load diff
	diffPath := filepath.Join(prDir, "diff.patch")
	if diff, err := ioutil.ReadFile(diffPath); err == nil {
		analysis.DiffPatch = string(diff)
	}

	// Perform technical analysis
	analysis.TechnicalAnalysis = p.analyzeTechnical(analysis.DiffPatch)

	// Perform business impact analysis
	analysis.BusinessImpact = p.analyzeBusinessImpact(analysis.Metadata, analysis.Description, analysis.DiffPatch)

	// Extract learning points
	analysis.LearningPoints = p.extractLearningPoints(analysis)

	// Generate action items
	analysis.ActionItems = p.generateActionItems(analysis)

	return analysis, nil
}

func (p *PRAnalyzer) loadMetadata(path string, metadata *PRMetadata) error {
	data, err := ioutil.ReadFile(path)
	if err != nil {
		return err
	}
	return json.Unmarshal(data, metadata)
}

func (p *PRAnalyzer) analyzeTechnical(diffPatch string) TechnicalAnalysis {
	analysis := TechnicalAnalysis{}

	if diffPatch == "" {
		return analysis
	}

	lines := strings.Split(diffPatch, "\n")
	filesChanged := make(map[string]bool)
	linesAdded := 0
	linesRemoved := 0

	for _, line := range lines {
		if strings.HasPrefix(line, "diff --git") {
			// Extract file path
			parts := strings.Fields(line)
			if len(parts) >= 4 {
				file := strings.TrimPrefix(parts[3], "b/")
				filesChanged[file] = true
			}
		} else if strings.HasPrefix(line, "+") && !strings.HasPrefix(line, "+++") {
			linesAdded++
		} else if strings.HasPrefix(line, "-") && !strings.HasPrefix(line, "---") {
			linesRemoved++
		}
	}

	for file := range filesChanged {
		analysis.FilesChanged = append(analysis.FilesChanged, file)
	}
	analysis.LinesAdded = linesAdded
	analysis.LinesRemoved = linesRemoved

	// Determine complexity
	totalChanges := linesAdded + linesRemoved
	if totalChanges < 50 {
		analysis.Complexity = "Low"
	} else if totalChanges < 200 {
		analysis.Complexity = "Medium"
	} else {
		analysis.Complexity = "High"
	}

	// Analyze architectural notes
	analysis.ArchitecturalNotes = p.extractArchitecturalNotes(diffPatch)

	// Analyze code quality
	analysis.CodeQuality = p.analyzeCodeQuality(diffPatch)

	// Analyze test coverage
	analysis.TestCoverage = p.analyzeTestCoverage(diffPatch)

	return analysis
}

func (p *PRAnalyzer) extractArchitecturalNotes(diffPatch string) []string {
	notes := []string{}

	if strings.Contains(diffPatch, "package main") {
		notes = append(notes, "New main package created - entry point implementation")
	}
	if strings.Contains(diffPatch, "func main()") {
		notes = append(notes, "Main function implementation - application entry point")
	}
	if strings.Contains(diffPatch, "import (") {
		notes = append(notes, "Dependencies managed through imports")
	}
	if strings.Contains(diffPatch, "go.mod") {
		notes = append(notes, "Go module configuration updated")
	}
	if strings.Contains(diffPatch, "_test.go") {
		notes = append(notes, "Test files included - good testing practices")
	}
	if strings.Contains(diffPatch, "context.") {
		notes = append(notes, "Context-aware implementation for cancellation/timeout")
	}
	if strings.Contains(diffPatch, "exec.Command") {
		notes = append(notes, "External command execution - system integration")
	}

	return notes
}

func (p *PRAnalyzer) analyzeCodeQuality(diffPatch string) []string {
	quality := []string{}

	if strings.Contains(diffPatch, "fmt.Errorf") {
		quality = append(quality, "✅ Proper error wrapping with context")
	}
	if strings.Contains(diffPatch, "defer ") {
		quality = append(quality, "✅ Resource cleanup with defer statements")
	}
	if strings.Contains(diffPatch, "strings.TrimSpace") {
		quality = append(quality, "✅ Input sanitization and validation")
	}
	if strings.Contains(diffPatch, "log.") {
		quality = append(quality, "✅ Structured logging implementation")
	}
	if strings.Contains(diffPatch, "t.Helper()") {
		quality = append(quality, "✅ Test helper functions for better error reporting")
	}
	if strings.Contains(diffPatch, "t.TempDir()") {
		quality = append(quality, "✅ Temporary directories for isolated testing")
	}

	return quality
}

func (p *PRAnalyzer) analyzeTestCoverage(diffPatch string) string {
	hasTests := strings.Contains(diffPatch, "_test.go")
	hasMainCode := strings.Contains(diffPatch, ".go") && !strings.Contains(diffPatch, "_test.go")

	if hasTests && hasMainCode {
		return "Good - Tests included with implementation"
	} else if hasTests {
		return "Test-only changes"
	} else if hasMainCode {
		return "⚠️ No tests found - consider adding test coverage"
	}

	return "Unknown"
}

func (p *PRAnalyzer) analyzeBusinessImpact(metadata PRMetadata, description, diffPatch string) BusinessImpact {
	impact := BusinessImpact{}

	// Determine feature category from title and description
	title := strings.ToLower(metadata.Title)
	desc := strings.ToLower(description)

	if strings.Contains(title, "feat") || strings.Contains(desc, "add") {
		impact.FeatureCategory = "New Feature"
		impact.UserImpact = "Positive - New functionality added"
	} else if strings.Contains(title, "fix") || strings.Contains(desc, "fix") {
		impact.FeatureCategory = "Bug Fix"
		impact.UserImpact = "Positive - Issue resolution"
	} else if strings.Contains(title, "refactor") {
		impact.FeatureCategory = "Refactoring"
		impact.UserImpact = "Neutral - No user-facing changes"
	} else {
		impact.FeatureCategory = "Enhancement"
		impact.UserImpact = "Positive - Improved functionality"
	}

	// Analyze maintenance impact
	if strings.Contains(diffPatch, "_test.go") {
		impact.MaintenanceImpact = "Positive - Tests improve maintainability"
	} else {
		impact.MaintenanceImpact = "Neutral - No significant maintenance changes"
	}

	// Analyze performance impact
	if strings.Contains(diffPatch, "context.WithTimeout") {
		impact.PerformanceImpact = "Positive - Timeout handling prevents hanging"
	} else {
		impact.PerformanceImpact = "Neutral - No significant performance changes"
	}

	// Analyze security impact
	if strings.Contains(diffPatch, "TrimSpace") || strings.Contains(diffPatch, "validation") {
		impact.SecurityImpact = "Positive - Input sanitization"
	} else {
		impact.SecurityImpact = "Neutral - No significant security changes"
	}

	return impact
}

func (p *PRAnalyzer) extractLearningPoints(analysis *PRAnalysis) []string {
	points := []string{}

	// Technical learning points
	if strings.Contains(analysis.DiffPatch, "exec.Command") {
		points = append(points, "💡 External command execution in Go using exec.CommandContext")
	}
	if strings.Contains(analysis.DiffPatch, "context.WithTimeout") {
		points = append(points, "💡 Context-based timeout handling for robust command execution")
	}
	if strings.Contains(analysis.DiffPatch, "t.Setenv") {
		points = append(points, "💡 Environment variable testing with t.Setenv for isolation")
	}
	if strings.Contains(analysis.DiffPatch, "json") {
		points = append(points, "💡 JSON processing for API integration")
	}
	if strings.Contains(analysis.DiffPatch, "gh pr list") {
		points = append(points, "💡 GitHub CLI integration for PR management")
	}

	// Add general learning points
	if analysis.TechnicalAnalysis.TestCoverage == "Good - Tests included with implementation" {
		points = append(points, "💡 Test-driven development with comprehensive test coverage")
	}

	return points
}

func (p *PRAnalyzer) generateActionItems(analysis *PRAnalysis) []string {
	items := []string{}

	if analysis.Metadata.State == "OPEN" {
		items = append(items, "📋 PR is still open - monitor for review feedback")
	}

	if analysis.TechnicalAnalysis.TestCoverage == "⚠️ No tests found - consider adding test coverage" {
		items = append(items, "📋 Add test coverage for better code quality")
	}

	if analysis.TechnicalAnalysis.Complexity == "High" {
		items = append(items, "📋 Consider breaking down complex changes into smaller PRs")
	}

	// Always add follow-up items
	items = append(items, "📋 Monitor CI/CD pipeline results")
	items = append(items, "📋 Review and address any reviewer feedback")

	return items
}

func (p *PRAnalyzer) IntegrateAnalysisUsingClaude(date string) error {
	year := date[:4]
	reportPath := filepath.Join(p.basePath, "reports", year, date, "daily-report.md")
	githubWorkDir := filepath.Join(p.basePath, "reports", year, date, "github-work")

	// Check if both files exist
	if _, err := os.Stat(reportPath); os.IsNotExist(err) {
		return fmt.Errorf("daily report file not found: %s", reportPath)
	}
	if _, err := os.Stat(githubWorkDir); os.IsNotExist(err) {
		return fmt.Errorf("GitHub work directory not found: %s", githubWorkDir)
	}

	fmt.Printf("🤖 Starting Claude Code integration process...\n")
	fmt.Printf("📄 Report file: %s\n", reportPath)
	fmt.Printf("📁 GitHub work dir: %s\n", githubWorkDir)

	return nil
}

func (p *PRAnalyzer) displayPRAnalysis(analysis *PRAnalysis) {
	fmt.Printf("🔗 **%s** | %s\n", analysis.Metadata.Title, analysis.Metadata.URL)
	fmt.Printf("📂 Repository: %s | PR #%d | Status: %s\n",
		analysis.Metadata.Repository, analysis.Metadata.Number, analysis.Metadata.State)
	fmt.Printf("👤 Author: %s | Created: %s\n\n",
		analysis.Metadata.Author, analysis.Metadata.CreatedAt[:10])

	// Technical Analysis
	fmt.Printf("🔧 **TECHNICAL ANALYSIS**\n")
	fmt.Printf("   📁 Files Changed: %d\n", len(analysis.TechnicalAnalysis.FilesChanged))
	for _, file := range analysis.TechnicalAnalysis.FilesChanged {
		fmt.Printf("      • %s\n", file)
	}
	fmt.Printf("   📊 Changes: +%d/-%d lines | Complexity: %s\n",
		analysis.TechnicalAnalysis.LinesAdded, analysis.TechnicalAnalysis.LinesRemoved, analysis.TechnicalAnalysis.Complexity)
	fmt.Printf("   🧪 Test Coverage: %s\n\n", analysis.TechnicalAnalysis.TestCoverage)

	// Architectural Notes
	if len(analysis.TechnicalAnalysis.ArchitecturalNotes) > 0 {
		fmt.Printf("🏗️  **ARCHITECTURAL INSIGHTS**\n")
		for _, note := range analysis.TechnicalAnalysis.ArchitecturalNotes {
			fmt.Printf("   • %s\n", note)
		}
		fmt.Printf("\n")
	}

	// Code Quality
	if len(analysis.TechnicalAnalysis.CodeQuality) > 0 {
		fmt.Printf("⭐ **CODE QUALITY**\n")
		for _, quality := range analysis.TechnicalAnalysis.CodeQuality {
			fmt.Printf("   %s\n", quality)
		}
		fmt.Printf("\n")
	}

	// Business Impact
	fmt.Printf("💼 **BUSINESS IMPACT**\n")
	fmt.Printf("   🎯 Category: %s\n", analysis.BusinessImpact.FeatureCategory)
	fmt.Printf("   👥 User Impact: %s\n", analysis.BusinessImpact.UserImpact)
	fmt.Printf("   🔧 Maintenance: %s\n", analysis.BusinessImpact.MaintenanceImpact)
	fmt.Printf("   ⚡ Performance: %s\n", analysis.BusinessImpact.PerformanceImpact)
	fmt.Printf("   🔒 Security: %s\n\n", analysis.BusinessImpact.SecurityImpact)

	// Learning Points
	if len(analysis.LearningPoints) > 0 {
		fmt.Printf("🎓 **LEARNING OPPORTUNITIES**\n")
		for _, point := range analysis.LearningPoints {
			fmt.Printf("   %s\n", point)
		}
		fmt.Printf("\n")
	}

	// Action Items
	if len(analysis.ActionItems) > 0 {
		fmt.Printf("✅ **ACTION ITEMS**\n")
		for _, item := range analysis.ActionItems {
			fmt.Printf("   %s\n", item)
		}
		fmt.Printf("\n")
	}
}
