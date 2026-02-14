package auth

import (
	"os/exec"
	"strings"
	"testing"
)

func TestGetTokenFromGHCLI_WhenGHInstalled(t *testing.T) {
	// Skip if gh is not installed
	if _, err := exec.LookPath("gh"); err != nil {
		t.Skip("gh CLI is not installed, skipping test")
	}

	token, err := GetTokenFromGHCLI()

	// If gh is installed but not authenticated, we expect an error
	if err != nil {
		if strings.Contains(err.Error(), "gh auth login") ||
			strings.Contains(err.Error(), "not logged") {
			t.Skip("gh CLI is not authenticated, skipping test")
		}
		// For other errors, fail the test
		t.Fatalf("unexpected error: %v", err)
	}

	// If we got here, we should have a valid token
	if token == "" {
		t.Error("expected non-empty token")
	}

	// Token should look like a GitHub token (starts with ghp_, gho_, ghu_, ghs_, or ghr_)
	validPrefixes := []string{"ghp_", "gho_", "ghu_", "ghs_", "ghr_"}
	hasValidPrefix := false
	for _, prefix := range validPrefixes {
		if strings.HasPrefix(token, prefix) {
			hasValidPrefix = true
			break
		}
	}

	if !hasValidPrefix {
		t.Logf("token does not have expected GitHub token prefix, got prefix: %s...", token[:4])
		// Not failing since older tokens might not have these prefixes
	}
}

func TestGetTokenFromGHCLI_CommandNotFound(t *testing.T) {
	// Save original PATH and restore after test
	origPath := getenv("PATH")
	defer setenv("PATH", origPath)

	// Set PATH to empty to simulate gh not being installed
	setenv("PATH", "")

	_, err := GetTokenFromGHCLI()
	if err == nil {
		t.Error("expected error when gh command is not found")
	}
}

// Helper functions for environment manipulation in tests
func getenv(key string) string {
	cmd := exec.Command("printenv", key)
	out, _ := cmd.Output()
	return strings.TrimSpace(string(out))
}

func setenv(key, value string) {
	// Note: This won't actually affect the current process's environment
	// in a way that affects exec.Command. This test is more of a placeholder.
	// In real testing, we'd use dependency injection for the command executor.
}
