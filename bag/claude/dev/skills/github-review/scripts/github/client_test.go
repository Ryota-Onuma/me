package github

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/google/go-github/v66/github"
)

func TestNewClient(t *testing.T) {
	ghClient := github.NewClient(nil)
	client := NewClient(ghClient)

	if client == nil {
		t.Fatal("expected non-nil client")
	}

	if client.gh != ghClient {
		t.Error("expected github client to be set")
	}
}

func TestCreateInlineComment(t *testing.T) {
	// Create a mock server
	mux := http.NewServeMux()
	server := httptest.NewServer(mux)
	defer server.Close()

	// Mock the create comment endpoint
	mux.HandleFunc("/repos/owner/repo/pulls/1/comments", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != "POST" {
			t.Errorf("expected POST, got %s", r.Method)
		}

		// Parse request body
		var req map[string]interface{}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			t.Fatalf("failed to decode request: %v", err)
		}

		// Verify required fields
		if req["body"] != "test comment" {
			t.Errorf("expected body 'test comment', got %v", req["body"])
		}
		if req["path"] != "src/main.go" {
			t.Errorf("expected path 'src/main.go', got %v", req["path"])
		}
		if req["line"] != float64(42) {
			t.Errorf("expected line 42, got %v", req["line"])
		}

		// Return mock response
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"id":       12345,
			"body":     req["body"],
			"path":     req["path"],
			"line":     req["line"],
			"html_url": "https://github.com/owner/repo/pull/1#discussion_r12345",
		})
	})

	// Create client pointing to mock server
	ghClient := github.NewClient(nil)
	ghClient.BaseURL, _ = ghClient.BaseURL.Parse(server.URL + "/")
	client := NewClient(ghClient)

	// Test CreateInlineComment
	ctx := context.Background()
	comment, err := client.CreateInlineComment(ctx, InlineCommentParams{
		Owner:    "owner",
		Repo:     "repo",
		PRNumber: 1,
		Path:     "src/main.go",
		Line:     42,
		Body:     "test comment",
	})

	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if comment.GetID() != 12345 {
		t.Errorf("expected comment ID 12345, got %d", comment.GetID())
	}
}

func TestCreateInlineComment_WithMultiLine(t *testing.T) {
	mux := http.NewServeMux()
	server := httptest.NewServer(mux)
	defer server.Close()

	mux.HandleFunc("/repos/owner/repo/pulls/1/comments", func(w http.ResponseWriter, r *http.Request) {
		var req map[string]interface{}
		json.NewDecoder(r.Body).Decode(&req)

		// Verify multi-line fields
		if req["start_line"] != float64(10) {
			t.Errorf("expected start_line 10, got %v", req["start_line"])
		}
		if req["line"] != float64(15) {
			t.Errorf("expected line 15, got %v", req["line"])
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"id":         12345,
			"start_line": 10,
			"line":       15,
		})
	})

	ghClient := github.NewClient(nil)
	ghClient.BaseURL, _ = ghClient.BaseURL.Parse(server.URL + "/")
	client := NewClient(ghClient)

	startLine := 10
	_, err := client.CreateInlineComment(context.Background(), InlineCommentParams{
		Owner:     "owner",
		Repo:      "repo",
		PRNumber:  1,
		Path:      "src/main.go",
		Line:      15,
		Body:      "multi-line comment",
		StartLine: &startLine,
	})

	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
}

func TestCreatePRComment(t *testing.T) {
	mux := http.NewServeMux()
	server := httptest.NewServer(mux)
	defer server.Close()

	mux.HandleFunc("/repos/owner/repo/issues/1/comments", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != "POST" {
			t.Errorf("expected POST, got %s", r.Method)
		}

		var req map[string]interface{}
		json.NewDecoder(r.Body).Decode(&req)

		if req["body"] != "PR comment" {
			t.Errorf("expected body 'PR comment', got %v", req["body"])
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"id":       67890,
			"body":     req["body"],
			"html_url": "https://github.com/owner/repo/pull/1#issuecomment-67890",
		})
	})

	ghClient := github.NewClient(nil)
	ghClient.BaseURL, _ = ghClient.BaseURL.Parse(server.URL + "/")
	client := NewClient(ghClient)

	comment, err := client.CreatePRComment(context.Background(), "owner", "repo", 1, "PR comment")

	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if comment.GetID() != 67890 {
		t.Errorf("expected comment ID 67890, got %d", comment.GetID())
	}
}

func TestCreateReview(t *testing.T) {
	mux := http.NewServeMux()
	server := httptest.NewServer(mux)
	defer server.Close()

	mux.HandleFunc("/repos/owner/repo/pulls/1/reviews", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != "POST" {
			t.Errorf("expected POST, got %s", r.Method)
		}

		var req map[string]interface{}
		json.NewDecoder(r.Body).Decode(&req)

		if req["event"] != "COMMENT" {
			t.Errorf("expected event 'COMMENT', got %v", req["event"])
		}

		comments := req["comments"].([]interface{})
		if len(comments) != 2 {
			t.Errorf("expected 2 comments, got %d", len(comments))
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"id":       99999,
			"body":     req["body"],
			"html_url": "https://github.com/owner/repo/pull/1#pullrequestreview-99999",
		})
	})

	ghClient := github.NewClient(nil)
	ghClient.BaseURL, _ = ghClient.BaseURL.Parse(server.URL + "/")
	client := NewClient(ghClient)

	review, err := client.CreateReview(context.Background(), CreateReviewParams{
		Owner:    "owner",
		Repo:     "repo",
		PRNumber: 1,
		Body:     "Review body",
		Event:    "COMMENT",
		Comments: []ReviewCommentParams{
			{Path: "file1.go", Line: 10, Body: "Comment 1"},
			{Path: "file2.go", Line: 20, Body: "Comment 2"},
		},
	})

	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if review.GetID() != 99999 {
		t.Errorf("expected review ID 99999, got %d", review.GetID())
	}
}

func TestCreateInlineComment_DefaultSide(t *testing.T) {
	mux := http.NewServeMux()
	server := httptest.NewServer(mux)
	defer server.Close()

	mux.HandleFunc("/repos/owner/repo/pulls/1/comments", func(w http.ResponseWriter, r *http.Request) {
		var req map[string]interface{}
		json.NewDecoder(r.Body).Decode(&req)

		// Verify default side is RIGHT
		if req["side"] != "RIGHT" {
			t.Errorf("expected default side 'RIGHT', got %v", req["side"])
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(map[string]interface{}{"id": 1})
	})

	ghClient := github.NewClient(nil)
	ghClient.BaseURL, _ = ghClient.BaseURL.Parse(server.URL + "/")
	client := NewClient(ghClient)

	_, err := client.CreateInlineComment(context.Background(), InlineCommentParams{
		Owner:    "owner",
		Repo:     "repo",
		PRNumber: 1,
		Path:     "test.go",
		Line:     1,
		Body:     "test",
		// Side not specified - should default to RIGHT
	})

	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
}
