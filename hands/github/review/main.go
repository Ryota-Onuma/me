// GitHub Review Comment CLI Tool
//
// A command-line tool for creating review comments on GitHub pull requests.
// Uses gh CLI for authentication.
//
// Usage:
//
//	github-review-cli inline --owner OWNER --repo REPO --pr NUMBER --path FILE --line LINE --body "comment"
//	github-review-cli comment --owner OWNER --repo REPO --pr NUMBER --body "comment"
//	github-review-cli review --owner OWNER --repo REPO --pr NUMBER --event COMMENT --body "review body"
package main

import (
	"context"
	"flag"
	"fmt"
	"os"

	"github.com/oryota/hands/github/review/auth"
	ghclient "github.com/oryota/hands/github/review/github"
)

func main() {
	if len(os.Args) < 2 {
		printUsage()
		os.Exit(1)
	}

	ctx := context.Background()

	switch os.Args[1] {
	case "inline":
		handleInline(ctx, os.Args[2:])
	case "comment":
		handleComment(ctx, os.Args[2:])
	case "review":
		handleReview(ctx, os.Args[2:])
	case "help", "-h", "--help":
		printUsage()
	default:
		fmt.Fprintf(os.Stderr, "Unknown command: %s\n", os.Args[1])
		printUsage()
		os.Exit(1)
	}
}

func printUsage() {
	fmt.Println(`GitHub Review Comment CLI Tool

Usage:
  github-review-cli <command> [options]

Commands:
  inline   Create an inline comment on a specific file/line in a PR
  comment  Create a general comment on a PR
  review   Create a review with optional inline comments

Examples:
  # Create inline comment
  github-review-cli inline \
    --owner octocat --repo hello-world --pr 123 \
    --path src/main.go --line 42 \
    --body "This variable should be renamed"

  # Create PR comment
  github-review-cli comment \
    --owner octocat --repo hello-world --pr 123 \
    --body "LGTM! Great work on this PR."

  # Create review
  github-review-cli review \
    --owner octocat --repo hello-world --pr 123 \
    --event APPROVE --body "Approved!"

Authentication:
  This tool uses gh CLI for authentication. Make sure you're logged in:
    gh auth login
    gh auth status`)
}

func handleInline(ctx context.Context, args []string) {
	fs := flag.NewFlagSet("inline", flag.ExitOnError)
	owner := fs.String("owner", "", "Repository owner (required)")
	repo := fs.String("repo", "", "Repository name (required)")
	pr := fs.Int("pr", 0, "Pull request number (required)")
	path := fs.String("path", "", "File path relative to repo root (required)")
	line := fs.Int("line", 0, "Line number (required)")
	body := fs.String("body", "", "Comment body (required)")
	side := fs.String("side", "RIGHT", "Side of diff: LEFT or RIGHT")
	startLine := fs.Int("start-line", 0, "Start line for multi-line comment (optional)")
	fs.Parse(args)

	if *owner == "" || *repo == "" || *pr == 0 || *path == "" || *line == 0 || *body == "" {
		fmt.Fprintln(os.Stderr, "Error: --owner, --repo, --pr, --path, --line, and --body are required")
		fs.PrintDefaults()
		os.Exit(1)
	}

	client, err := createClient(ctx)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error: %v\n", err)
		os.Exit(1)
	}

	params := ghclient.InlineCommentParams{
		Owner:    *owner,
		Repo:     *repo,
		PRNumber: *pr,
		Path:     *path,
		Line:     *line,
		Body:     *body,
		Side:     *side,
	}
	if *startLine > 0 {
		params.StartLine = startLine
	}

	comment, err := client.CreateInlineComment(ctx, params)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error: %v\n", err)
		os.Exit(1)
	}

	fmt.Printf("Created inline comment (ID: %d)\n", comment.GetID())
	fmt.Printf("URL: %s\n", comment.GetHTMLURL())
}

func handleComment(ctx context.Context, args []string) {
	fs := flag.NewFlagSet("comment", flag.ExitOnError)
	owner := fs.String("owner", "", "Repository owner (required)")
	repo := fs.String("repo", "", "Repository name (required)")
	pr := fs.Int("pr", 0, "Pull request number (required)")
	body := fs.String("body", "", "Comment body (required)")
	fs.Parse(args)

	if *owner == "" || *repo == "" || *pr == 0 || *body == "" {
		fmt.Fprintln(os.Stderr, "Error: --owner, --repo, --pr, and --body are required")
		fs.PrintDefaults()
		os.Exit(1)
	}

	client, err := createClient(ctx)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error: %v\n", err)
		os.Exit(1)
	}

	comment, err := client.CreatePRComment(ctx, *owner, *repo, *pr, *body)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error: %v\n", err)
		os.Exit(1)
	}

	fmt.Printf("Created comment (ID: %d)\n", comment.GetID())
	fmt.Printf("URL: %s\n", comment.GetHTMLURL())
}

func handleReview(ctx context.Context, args []string) {
	fs := flag.NewFlagSet("review", flag.ExitOnError)
	owner := fs.String("owner", "", "Repository owner (required)")
	repo := fs.String("repo", "", "Repository name (required)")
	pr := fs.Int("pr", 0, "Pull request number (required)")
	event := fs.String("event", "COMMENT", "Review event: APPROVE, REQUEST_CHANGES, or COMMENT")
	body := fs.String("body", "", "Review body")
	fs.Parse(args)

	if *owner == "" || *repo == "" || *pr == 0 {
		fmt.Fprintln(os.Stderr, "Error: --owner, --repo, and --pr are required")
		fs.PrintDefaults()
		os.Exit(1)
	}

	client, err := createClient(ctx)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error: %v\n", err)
		os.Exit(1)
	}

	review, err := client.CreateReview(ctx, ghclient.CreateReviewParams{
		Owner:    *owner,
		Repo:     *repo,
		PRNumber: *pr,
		Event:    *event,
		Body:     *body,
	})
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error: %v\n", err)
		os.Exit(1)
	}

	fmt.Printf("Created review (ID: %d)\n", review.GetID())
	fmt.Printf("URL: %s\n", review.GetHTMLURL())
}

func createClient(ctx context.Context) (*ghclient.Client, error) {
	ghClient, err := auth.NewGitHubClient(ctx)
	if err != nil {
		return nil, err
	}
	return ghclient.NewClient(ghClient), nil
}
