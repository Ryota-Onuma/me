// Package auth provides authentication utilities for GitHub API access.
package auth

import (
	"context"
	"fmt"
	"os/exec"
	"strings"

	"github.com/google/go-github/v66/github"
	"golang.org/x/oauth2"
)

// GetTokenFromGHCLI retrieves the GitHub authentication token from gh CLI.
// It executes `gh auth token` and returns the token string.
func GetTokenFromGHCLI() (string, error) {
	cmd := exec.Command("gh", "auth", "token")
	output, err := cmd.Output()
	if err != nil {
		if exitErr, ok := err.(*exec.ExitError); ok {
			return "", fmt.Errorf("gh auth token failed: %s", string(exitErr.Stderr))
		}
		return "", fmt.Errorf("failed to execute gh auth token: %w", err)
	}

	token := strings.TrimSpace(string(output))
	if token == "" {
		return "", fmt.Errorf("gh auth token returned empty token, please run 'gh auth login' first")
	}

	return token, nil
}

// NewGitHubClient creates a new GitHub client using the token from gh CLI.
func NewGitHubClient(ctx context.Context) (*github.Client, error) {
	token, err := GetTokenFromGHCLI()
	if err != nil {
		return nil, err
	}

	ts := oauth2.StaticTokenSource(
		&oauth2.Token{AccessToken: token},
	)
	tc := oauth2.NewClient(ctx, ts)

	return github.NewClient(tc), nil
}
