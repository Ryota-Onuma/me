// Package github provides a wrapper around the GitHub API client
// for creating pull request review comments.
package github

import (
	"context"
	"fmt"

	"github.com/google/go-github/v66/github"
)

// Client wraps the GitHub API client with convenience methods for PR comments.
type Client struct {
	gh *github.Client
}

// NewClient creates a new Client from an existing GitHub client.
func NewClient(gh *github.Client) *Client {
	return &Client{gh: gh}
}

// InlineCommentParams contains parameters for creating an inline comment.
type InlineCommentParams struct {
	Owner     string
	Repo      string
	PRNumber  int
	Path      string
	Line      int
	Body      string
	Side      string // "LEFT" or "RIGHT", defaults to "RIGHT"
	StartLine *int   // For multi-line comments
}

// CreateInlineComment creates an inline comment on a specific file and line in a PR.
// This uses the pull request review comments API.
func (c *Client) CreateInlineComment(ctx context.Context, params InlineCommentParams) (*github.PullRequestComment, error) {
	// Set default side
	side := params.Side
	if side == "" {
		side = "RIGHT"
	}

	line := params.Line
	comment := &github.PullRequestComment{
		Body: github.String(params.Body),
		Path: github.String(params.Path),
		Line: &line,
		Side: github.String(side),
	}

	// Handle multi-line comments
	if params.StartLine != nil && *params.StartLine < params.Line {
		comment.StartLine = params.StartLine
		comment.StartSide = github.String(side)
	}

	created, _, err := c.gh.PullRequests.CreateComment(ctx, params.Owner, params.Repo, params.PRNumber, comment)
	if err != nil {
		return nil, fmt.Errorf("failed to create inline comment: %w", err)
	}

	return created, nil
}

// CreatePRComment creates a general comment on a PR (not tied to a specific line).
// This uses the issue comments API since PRs are a type of issue in GitHub.
func (c *Client) CreatePRComment(ctx context.Context, owner, repo string, prNumber int, body string) (*github.IssueComment, error) {
	comment := &github.IssueComment{
		Body: github.String(body),
	}

	created, _, err := c.gh.Issues.CreateComment(ctx, owner, repo, prNumber, comment)
	if err != nil {
		return nil, fmt.Errorf("failed to create PR comment: %w", err)
	}

	return created, nil
}

// ReviewCommentParams contains parameters for a single comment in a review.
type ReviewCommentParams struct {
	Path      string
	Line      int
	Body      string
	Side      string
	StartLine *int
}

// CreateReviewParams contains parameters for creating a review with multiple comments.
type CreateReviewParams struct {
	Owner    string
	Repo     string
	PRNumber int
	Body     string                // Overall review body
	Event    string                // "APPROVE", "REQUEST_CHANGES", or "COMMENT"
	Comments []ReviewCommentParams // Inline comments to include
}

// CreateReview creates a review with multiple inline comments at once.
// This is more efficient than creating individual comments.
func (c *Client) CreateReview(ctx context.Context, params CreateReviewParams) (*github.PullRequestReview, error) {
	// Convert our params to GitHub API format
	var comments []*github.DraftReviewComment
	for _, cm := range params.Comments {
		side := cm.Side
		if side == "" {
			side = "RIGHT"
		}

		line := cm.Line
		comment := &github.DraftReviewComment{
			Path: github.String(cm.Path),
			Line: &line,
			Body: github.String(cm.Body),
			Side: github.String(side),
		}

		if cm.StartLine != nil && *cm.StartLine < cm.Line {
			comment.StartLine = cm.StartLine
			comment.StartSide = github.String(side)
		}

		comments = append(comments, comment)
	}

	// Set default event
	event := params.Event
	if event == "" {
		event = "COMMENT"
	}

	review := &github.PullRequestReviewRequest{
		Body:     github.String(params.Body),
		Event:    github.String(event),
		Comments: comments,
	}

	created, _, err := c.gh.PullRequests.CreateReview(ctx, params.Owner, params.Repo, params.PRNumber, review)
	if err != nil {
		return nil, fmt.Errorf("failed to create review: %w", err)
	}

	return created, nil
}

