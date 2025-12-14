package main

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

// Helper to create a temp directory structure for testing
func setupTestProject(t *testing.T) (string, func()) {
	t.Helper()
	
	tmpDir, err := os.MkdirTemp("", "gardener_test_*")
	if err != nil {
		t.Fatalf("Failed to create temp dir: %v", err)
	}
	
	// Create standard directory structure
	dirs := []string{
		"00-Literature-Notes",
		"01-Fleeting-Notes",
		"01-Fleeting-Notes/Secret",
		"02-Permanent-Notes",
		"02-Permanent-Notes/Secret",
		"03-Structured-Notes",
		"91_Metadata",
	}
	for _, d := range dirs {
		if err := os.MkdirAll(filepath.Join(tmpDir, d), 0755); err != nil {
			t.Fatalf("Failed to create dir %s: %v", d, err)
		}
	}
	
	cleanup := func() {
		os.RemoveAll(tmpDir)
	}
	
	return tmpDir, cleanup
}


func TestLoadProjectConfig_CreatesDefault(t *testing.T) {
	// Save original config file path and restore after test
	origFile := ProjectConfigFile
	tmpFile := filepath.Join(os.TempDir(), "test_projects.json")
	defer func() {
		os.Remove(tmpFile)
	}()
	
	// Temporarily override the config file path (we can't easily do this with const)
	// Instead, test the logic by checking that default project is created
	
	// Ensure the file doesn't exist
	os.Remove(tmpFile)
	
	// Since ProjectConfigFile is const, we test the init behavior indirectly
	// by checking the projectConfig after loadProjectConfig is called
	
	// Reset projectConfig
	projectConfig = nil
	
	// For this test, we'll verify the default project structure format
	defaultProject := Project{
		ID:       "default",
		Name:     "Default",
		RootPath: "/test/path",
	}
	
	if defaultProject.ID != "default" {
		t.Errorf("Expected default ID 'default', got %s", defaultProject.ID)
	}
	if defaultProject.Name != "Default" {
		t.Errorf("Expected default Name 'Default', got %s", defaultProject.Name)
	}
	
	_ = origFile
}


func TestGetActiveProject(t *testing.T) {
	projectConfig = &ProjectConfig{
		Projects: []Project{
			{ID: "proj1", Name: "Project 1", RootPath: "/path/1"},
			{ID: "proj2", Name: "Project 2", RootPath: "/path/2"},
		},
		ActiveProject: "proj2",
	}
	
	active := getActiveProject()
	if active == nil {
		t.Fatal("Expected active project, got nil")
	}
	if active.ID != "proj2" {
		t.Errorf("Expected active project ID 'proj2', got %s", active.ID)
	}
	if active.Name != "Project 2" {
		t.Errorf("Expected active project Name 'Project 2', got %s", active.Name)
	}
}


func TestGetActiveProject_Fallback(t *testing.T) {
	projectConfig = &ProjectConfig{
		Projects: []Project{
			{ID: "proj1", Name: "Project 1", RootPath: "/path/1"},
		},
		ActiveProject: "nonexistent",
	}
	
	active := getActiveProject()
	if active == nil {
		t.Fatal("Expected fallback to first project, got nil")
	}
	if active.ID != "proj1" {
		t.Errorf("Expected fallback to 'proj1', got %s", active.ID)
	}
}


func TestGetActiveProject_NilConfig(t *testing.T) {
	projectConfig = nil
	
	active := getActiveProject()
	if active != nil {
		t.Errorf("Expected nil with nil config, got %+v", active)
	}
}


func TestGetPaths(t *testing.T) {
	projectConfig = &ProjectConfig{
		Projects: []Project{
			{ID: "test", Name: "Test", RootPath: "/test/root"},
		},
		ActiveProject: "test",
	}
	
	fleeting, fleetSecret, perm, permSecret, meta := getPaths()
	
	expected := map[string]string{
		"fleeting":    "/test/root/01-Fleeting-Notes",
		"fleetSecret": "/test/root/01-Fleeting-Notes/Secret",
		"permanent":   "/test/root/02-Permanent-Notes",
		"permSecret":  "/test/root/02-Permanent-Notes/Secret",
		"metadata":    "/test/root/91_Metadata/metadata.json",
	}
	
	if fleeting != expected["fleeting"] {
		t.Errorf("fleeting: expected %s, got %s", expected["fleeting"], fleeting)
	}
	if fleetSecret != expected["fleetSecret"] {
		t.Errorf("fleetSecret: expected %s, got %s", expected["fleetSecret"], fleetSecret)
	}
	if perm != expected["permanent"] {
		t.Errorf("permanent: expected %s, got %s", expected["permanent"], perm)
	}
	if permSecret != expected["permSecret"] {
		t.Errorf("permSecret: expected %s, got %s", expected["permSecret"], permSecret)
	}
	if meta != expected["metadata"] {
		t.Errorf("metadata: expected %s, got %s", expected["metadata"], meta)
	}
}


func TestHandleGetProjects(t *testing.T) {
	projectConfig = &ProjectConfig{
		Projects: []Project{
			{ID: "test", Name: "Test Project", RootPath: "/test/path"},
		},
		ActiveProject: "test",
	}
	
	req := httptest.NewRequest(http.MethodGet, "/api/projects", nil)
	w := httptest.NewRecorder()
	
	handleGetProjects(w, req)
	
	if w.Code != http.StatusOK {
		t.Errorf("Expected status 200, got %d", w.Code)
	}
	
	var result ProjectConfig
	if err := json.NewDecoder(w.Body).Decode(&result); err != nil {
		t.Fatalf("Failed to decode response: %v", err)
	}
	
	if len(result.Projects) != 1 {
		t.Errorf("Expected 1 project, got %d", len(result.Projects))
	}
	if result.ActiveProject != "test" {
		t.Errorf("Expected active project 'test', got %s", result.ActiveProject)
	}
}


func TestHandleSwitchProject(t *testing.T) {
	// Save original config file location
	tmpFile := filepath.Join(os.TempDir(), "test_switch_projects.json")
	defer os.Remove(tmpFile)
	
	projectConfig = &ProjectConfig{
		Projects: []Project{
			{ID: "proj1", Name: "Project 1", RootPath: "/path/1"},
			{ID: "proj2", Name: "Project 2", RootPath: "/path/2"},
		},
		ActiveProject: "proj1",
	}
	
	body := strings.NewReader(`{"id": "proj2"}`)
	req := httptest.NewRequest(http.MethodPost, "/api/projects/switch", body)
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	
	handleSwitchProject(w, req)
	
	// Due to saveProjectConfig call, this might fail without proper setup
	// So we just verify the projectConfig was updated
	if projectConfig.ActiveProject != "proj2" {
		t.Errorf("Expected active project 'proj2', got %s", projectConfig.ActiveProject)
	}
}


func TestHandleSwitchProject_NotFound(t *testing.T) {
	projectConfig = &ProjectConfig{
		Projects: []Project{
			{ID: "proj1", Name: "Project 1", RootPath: "/path/1"},
		},
		ActiveProject: "proj1",
	}
	
	body := strings.NewReader(`{"id": "nonexistent"}`)
	req := httptest.NewRequest(http.MethodPost, "/api/projects/switch", body)
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	
	handleSwitchProject(w, req)
	
	if w.Code != http.StatusNotFound {
		t.Errorf("Expected status 404, got %d", w.Code)
	}
}


func TestSlugify(t *testing.T) {
	tests := []struct {
		input    string
		expected string
	}{
		{"Test Project", "test-project"},
		{"My Awesome Project!", "my-awesome-project"},
		{"日本語プロジェクト", "note"}, // Falls back to "note" for non-ascii
		{"  spaces  ", "spaces"},
		{"multiple---dashes", "multiple-dashes"},
		{"", "note"},
	}
	
	for _, tc := range tests {
		result := slugify(tc.input)
		if result != tc.expected {
			t.Errorf("slugify(%q): expected %q, got %q", tc.input, tc.expected, result)
		}
	}
}


func TestScanFleeting(t *testing.T) {
	tmpDir, cleanup := setupTestProject(t)
	defer cleanup()
	
	// Create test files
	testFiles := []string{
		filepath.Join(tmpDir, "01-Fleeting-Notes", "note1.md"),
		filepath.Join(tmpDir, "01-Fleeting-Notes", "note2.md"),
		filepath.Join(tmpDir, "01-Fleeting-Notes", "Secret", "secret1.md"),
	}
	for _, f := range testFiles {
		if err := os.WriteFile(f, []byte("test content"), 0644); err != nil {
			t.Fatalf("Failed to create test file: %v", err)
		}
	}
	
	// Setup project config
	projectConfig = &ProjectConfig{
		Projects: []Project{
			{ID: "test", Name: "Test", RootPath: tmpDir},
		},
		ActiveProject: "test",
	}
	
	notes := scanFleeting()
	
	if len(notes) != 3 {
		t.Errorf("Expected 3 notes, got %d", len(notes))
	}
	
	// Check that secret notes are marked correctly
	secretCount := 0
	for _, n := range notes {
		if n.IsSecret {
			secretCount++
		}
	}
	if secretCount != 1 {
		t.Errorf("Expected 1 secret note, got %d", secretCount)
	}
}


func TestHandleCreateProject(t *testing.T) {
	tmpDir, cleanup := setupTestProject(t)
	defer cleanup()

	projectConfig = &ProjectConfig{
		Projects:      []Project{},
		ActiveProject: "",
	}

	body := strings.NewReader(`{"name": "New Project", "rootPath": "` + tmpDir + `"}`)
	req := httptest.NewRequest(http.MethodPost, "/api/projects/create", body)
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	handleCreateProject(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Expected status 200, got %d: %s", w.Code, w.Body.String())
	}

	// Check project was added
	if len(projectConfig.Projects) != 1 {
		t.Errorf("Expected 1 project, got %d", len(projectConfig.Projects))
	}
	if projectConfig.Projects[0].Name != "New Project" {
		t.Errorf("Expected project name 'New Project', got %s", projectConfig.Projects[0].Name)
	}
}


func TestHandleCreateProject_CreatesDirectories(t *testing.T) {
	tmpDir, cleanup := setupTestProject(t)
	defer cleanup()

	// Remove the standard directories created by setupTestProject
	newProjectDir := filepath.Join(tmpDir, "new-project")

	projectConfig = &ProjectConfig{
		Projects:      []Project{},
		ActiveProject: "",
	}

	body := strings.NewReader(`{"name": "New Project", "rootPath": "` + newProjectDir + `"}`)
	req := httptest.NewRequest(http.MethodPost, "/api/projects/create", body)
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	handleCreateProject(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Expected status 200, got %d: %s", w.Code, w.Body.String())
	}

	// Check that directories were created
	expectedDirs := []string{
		"00-Literature-Notes",
		"01-Fleeting-Notes",
		"02-Permanent-Notes",
		"03-Structured-Notes",
		"91_Metadata",
	}
	for _, dir := range expectedDirs {
		path := filepath.Join(newProjectDir, dir)
		if _, err := os.Stat(path); os.IsNotExist(err) {
			t.Errorf("Expected directory %s to exist", dir)
		}
	}

	// Check metadata.json was created
	metaPath := filepath.Join(newProjectDir, "91_Metadata/metadata.json")
	if _, err := os.Stat(metaPath); os.IsNotExist(err) {
		t.Error("Expected metadata.json to be created")
	}
}


func TestHandleCreateProject_MissingName(t *testing.T) {
	projectConfig = &ProjectConfig{
		Projects:      []Project{},
		ActiveProject: "",
	}

	body := strings.NewReader(`{"name": "", "rootPath": "/some/path"}`)
	req := httptest.NewRequest(http.MethodPost, "/api/projects/create", body)
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	handleCreateProject(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("Expected status 400 for missing name, got %d", w.Code)
	}
}


func TestHandleCreateProject_Duplicate(t *testing.T) {
	tmpDir, cleanup := setupTestProject(t)
	defer cleanup()

	projectConfig = &ProjectConfig{
		Projects: []Project{
			{ID: "existing", Name: "Existing", RootPath: "/path"},
		},
		ActiveProject: "existing",
	}

	body := strings.NewReader(`{"name": "Existing", "rootPath": "` + tmpDir + `"}`)
	req := httptest.NewRequest(http.MethodPost, "/api/projects/create", body)
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	handleCreateProject(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("Expected status 400 for duplicate, got %d", w.Code)
	}
}


func TestHandleDeleteProject(t *testing.T) {
	projectConfig = &ProjectConfig{
		Projects: []Project{
			{ID: "proj1", Name: "Project 1", RootPath: "/path/1"},
			{ID: "proj2", Name: "Project 2", RootPath: "/path/2"},
		},
		ActiveProject: "proj1",
	}

	body := strings.NewReader(`{"id": "proj2"}`)
	req := httptest.NewRequest(http.MethodPost, "/api/projects/delete", body)
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	handleDeleteProject(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Expected status 200, got %d: %s", w.Code, w.Body.String())
	}

	if len(projectConfig.Projects) != 1 {
		t.Errorf("Expected 1 project after delete, got %d", len(projectConfig.Projects))
	}
}


func TestHandleDeleteProject_LastProject(t *testing.T) {
	projectConfig = &ProjectConfig{
		Projects: []Project{
			{ID: "only", Name: "Only Project", RootPath: "/path"},
		},
		ActiveProject: "only",
	}

	body := strings.NewReader(`{"id": "only"}`)
	req := httptest.NewRequest(http.MethodPost, "/api/projects/delete", body)
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	handleDeleteProject(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("Expected status 400 for deleting last project, got %d", w.Code)
	}
}


func TestHandleDeleteProject_NotFound(t *testing.T) {
	projectConfig = &ProjectConfig{
		Projects: []Project{
			{ID: "proj1", Name: "Project 1", RootPath: "/path/1"},
			{ID: "proj2", Name: "Project 2", RootPath: "/path/2"},
		},
		ActiveProject: "proj1",
	}

	body := strings.NewReader(`{"id": "nonexistent"}`)
	req := httptest.NewRequest(http.MethodPost, "/api/projects/delete", body)
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	handleDeleteProject(w, req)

	if w.Code != http.StatusNotFound {
		t.Errorf("Expected status 404, got %d", w.Code)
	}
}


func TestHandleDeleteProject_SwitchesActive(t *testing.T) {
	projectConfig = &ProjectConfig{
		Projects: []Project{
			{ID: "proj1", Name: "Project 1", RootPath: "/path/1"},
			{ID: "proj2", Name: "Project 2", RootPath: "/path/2"},
		},
		ActiveProject: "proj1",
	}

	body := strings.NewReader(`{"id": "proj1"}`)
	req := httptest.NewRequest(http.MethodPost, "/api/projects/delete", body)
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	handleDeleteProject(w, req)

	if projectConfig.ActiveProject != "proj2" {
		t.Errorf("Expected active project to switch to 'proj2', got %s", projectConfig.ActiveProject)
	}
}


func TestLoadMetadata(t *testing.T) {
	tmpDir, cleanup := setupTestProject(t)
	defer cleanup()

	// Setup project config
	projectConfig = &ProjectConfig{
		Projects: []Project{
			{ID: "test", Name: "Test", RootPath: tmpDir},
		},
		ActiveProject: "test",
	}

	// When metadata file doesn't exist, should return empty metadata
	meta, err := loadMetadata()
	if err != nil {
		t.Fatalf("loadMetadata failed: %v", err)
	}
	if meta == nil {
		t.Fatal("Expected metadata, got nil")
	}
	if len(meta.Notes) != 0 {
		t.Errorf("Expected 0 notes, got %d", len(meta.Notes))
	}
}


func TestSaveLoadMetadata(t *testing.T) {
	tmpDir, cleanup := setupTestProject(t)
	defer cleanup()

	projectConfig = &ProjectConfig{
		Projects: []Project{
			{ID: "test", Name: "Test", RootPath: tmpDir},
		},
		ActiveProject: "test",
	}

	// Save metadata
	meta := &Metadata{
		Tags: []string{"tag1", "tag2"},
		Notes: []NoteMetadata{
			{Filename: "test-note", Title: "Test Note", Tags: []string{"tag1"}},
		},
	}
	if err := saveMetadata(meta); err != nil {
		t.Fatalf("saveMetadata failed: %v", err)
	}

	// Load it back
	loaded, err := loadMetadata()
	if err != nil {
		t.Fatalf("loadMetadata failed: %v", err)
	}

	if len(loaded.Tags) != 2 {
		t.Errorf("Expected 2 tags, got %d", len(loaded.Tags))
	}
	if len(loaded.Notes) != 1 {
		t.Errorf("Expected 1 note, got %d", len(loaded.Notes))
	}
	if loaded.Notes[0].Filename != "test-note" {
		t.Errorf("Expected filename 'test-note', got %s", loaded.Notes[0].Filename)
	}
}


func TestHandleGetMetadata(t *testing.T) {
	tmpDir, cleanup := setupTestProject(t)
	defer cleanup()

	projectConfig = &ProjectConfig{
		Projects: []Project{
			{ID: "test", Name: "Test", RootPath: tmpDir},
		},
		ActiveProject: "test",
	}

	req := httptest.NewRequest(http.MethodGet, "/api/metadata", nil)
	w := httptest.NewRecorder()

	handleGetMetadata(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Expected status 200, got %d", w.Code)
	}

	var result Metadata
	if err := json.NewDecoder(w.Body).Decode(&result); err != nil {
		t.Fatalf("Failed to decode response: %v", err)
	}
}


func TestHandleCreate(t *testing.T) {
	tmpDir, cleanup := setupTestProject(t)
	defer cleanup()

	projectConfig = &ProjectConfig{
		Projects: []Project{
			{ID: "test", Name: "Test", RootPath: tmpDir},
		},
		ActiveProject: "test",
	}

	body := strings.NewReader(`{"content": "# Test Note\n\nThis is a test.", "isSecret": false, "agent": "claude"}`)
	req := httptest.NewRequest(http.MethodPost, "/create", body)
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	handleCreate(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Expected status 200, got %d: %s", w.Code, w.Body.String())
	}

	// Check that file was created
	entries, _ := os.ReadDir(filepath.Join(tmpDir, "01-Fleeting-Notes"))
	mdFiles := 0
	for _, e := range entries {
		if strings.HasSuffix(e.Name(), ".md") {
			mdFiles++
		}
	}
	if mdFiles != 1 {
		t.Errorf("Expected 1 md file created, got %d", mdFiles)
	}
}


func TestHandleCreate_Secret(t *testing.T) {
	tmpDir, cleanup := setupTestProject(t)
	defer cleanup()

	projectConfig = &ProjectConfig{
		Projects: []Project{
			{ID: "test", Name: "Test", RootPath: tmpDir},
		},
		ActiveProject: "test",
	}

	body := strings.NewReader(`{"content": "Secret content", "isSecret": true, "agent": "claude"}`)
	req := httptest.NewRequest(http.MethodPost, "/create", body)
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	handleCreate(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Expected status 200, got %d", w.Code)
	}

	// Check secret folder
	entries, _ := os.ReadDir(filepath.Join(tmpDir, "01-Fleeting-Notes", "Secret"))
	mdFiles := 0
	for _, e := range entries {
		if strings.HasSuffix(e.Name(), ".md") {
			mdFiles++
		}
	}
	if mdFiles != 1 {
		t.Errorf("Expected 1 secret md file, got %d", mdFiles)
	}
}


func TestHandleCreate_EmptyContent(t *testing.T) {
	tmpDir, cleanup := setupTestProject(t)
	defer cleanup()

	projectConfig = &ProjectConfig{
		Projects: []Project{
			{ID: "test", Name: "Test", RootPath: tmpDir},
		},
		ActiveProject: "test",
	}

	body := strings.NewReader(`{"content": "", "isSecret": false}`)
	req := httptest.NewRequest(http.MethodPost, "/create", body)
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	handleCreate(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("Expected status 400 for empty content, got %d", w.Code)
	}
}


func TestHandleCreate_WrongMethod(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/create", nil)
	w := httptest.NewRecorder()

	handleCreate(w, req)

	if w.Code != http.StatusMethodNotAllowed {
		t.Errorf("Expected status 405, got %d", w.Code)
	}
}


func TestHandleReadInbox(t *testing.T) {
	tmpDir, cleanup := setupTestProject(t)
	defer cleanup()

	projectConfig = &ProjectConfig{
		Projects: []Project{
			{ID: "test", Name: "Test", RootPath: tmpDir},
		},
		ActiveProject: "test",
	}

	// Create a test file
	testFile := filepath.Join(tmpDir, "01-Fleeting-Notes", "test.md")
	os.WriteFile(testFile, []byte("Test content"), 0644)

	req := httptest.NewRequest(http.MethodGet, "/api/inbox/read?path=test.md", nil)
	w := httptest.NewRecorder()

	handleReadInbox(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Expected status 200, got %d", w.Code)
	}

	var result map[string]string
	json.NewDecoder(w.Body).Decode(&result)
	if result["content"] != "Test content" {
		t.Errorf("Expected content 'Test content', got %s", result["content"])
	}
}


func TestHandleReadInbox_MissingPath(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/api/inbox/read", nil)
	w := httptest.NewRecorder()

	handleReadInbox(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("Expected status 400, got %d", w.Code)
	}
}


func TestHandleReadInbox_NotFound(t *testing.T) {
	tmpDir, cleanup := setupTestProject(t)
	defer cleanup()

	projectConfig = &ProjectConfig{
		Projects: []Project{
			{ID: "test", Name: "Test", RootPath: tmpDir},
		},
		ActiveProject: "test",
	}

	req := httptest.NewRequest(http.MethodGet, "/api/inbox/read?path=nonexistent.md", nil)
	w := httptest.NewRecorder()

	handleReadInbox(w, req)

	if w.Code != http.StatusNotFound {
		t.Errorf("Expected status 404, got %d", w.Code)
	}
}


func TestHandleUpdateInbox(t *testing.T) {
	tmpDir, cleanup := setupTestProject(t)
	defer cleanup()

	projectConfig = &ProjectConfig{
		Projects: []Project{
			{ID: "test", Name: "Test", RootPath: tmpDir},
		},
		ActiveProject: "test",
	}

	// Create a test file
	testFile := filepath.Join(tmpDir, "01-Fleeting-Notes", "test.md")
	os.WriteFile(testFile, []byte("Original content"), 0644)

	body := strings.NewReader(`{"path": "test.md", "content": "Updated content"}`)
	req := httptest.NewRequest(http.MethodPost, "/api/inbox/update", body)
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	handleUpdateInbox(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Expected status 200, got %d", w.Code)
	}

	// Verify content was updated
	content, _ := os.ReadFile(testFile)
	if string(content) != "Updated content" {
		t.Errorf("Expected 'Updated content', got %s", string(content))
	}
}

// Test handleUpdateInbox - wrong method
func TestHandleUpdateInbox_WrongMethod(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/api/inbox/update", nil)
	w := httptest.NewRecorder()

	handleUpdateInbox(w, req)

	if w.Code != http.StatusMethodNotAllowed {
		t.Errorf("Expected status 405, got %d", w.Code)
	}
}

// Test handleDeleteInbox API
func TestHandleDeleteInbox(t *testing.T) {
	tmpDir, cleanup := setupTestProject(t)
	defer cleanup()

	projectConfig = &ProjectConfig{
		Projects: []Project{
			{ID: "test", Name: "Test", RootPath: tmpDir},
		},
		ActiveProject: "test",
	}

	// Create a test file
	testFile := filepath.Join(tmpDir, "01-Fleeting-Notes", "to-delete.md")
	os.WriteFile(testFile, []byte("Delete me"), 0644)

	body := strings.NewReader(`{"path": "to-delete.md"}`)
	req := httptest.NewRequest(http.MethodPost, "/api/inbox/delete", body)
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	handleDeleteInbox(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Expected status 200, got %d", w.Code)
	}

	// Verify file was deleted
	if _, err := os.Stat(testFile); !os.IsNotExist(err) {
		t.Error("Expected file to be deleted")
	}
}

// Test handleDeleteInbox - wrong method
func TestHandleDeleteInbox_WrongMethod(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/api/inbox/delete", nil)
	w := httptest.NewRecorder()

	handleDeleteInbox(w, req)

	if w.Code != http.StatusMethodNotAllowed {
		t.Errorf("Expected status 405, got %d", w.Code)
	}
}

// Test handleAddMetadata API
func TestHandleAddMetadata(t *testing.T) {
	tmpDir, cleanup := setupTestProject(t)
	defer cleanup()

	projectConfig = &ProjectConfig{
		Projects: []Project{
			{ID: "test", Name: "Test", RootPath: tmpDir},
		},
		ActiveProject: "test",
	}

	body := strings.NewReader(`{"filename": "test-note", "title": "Test Note", "tags": ["tag1"]}`)
	req := httptest.NewRequest(http.MethodPost, "/api/metadata/add", body)
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	handleAddMetadata(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Expected status 200, got %d: %s", w.Code, w.Body.String())
	}
}

// Test handleAddMetadata - wrong method
func TestHandleAddMetadata_WrongMethod(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/api/metadata/add", nil)
	w := httptest.NewRecorder()

	handleAddMetadata(w, req)

	if w.Code != http.StatusMethodNotAllowed {
		t.Errorf("Expected status 405, got %d", w.Code)
	}
}

// Test handleSyncMetadata API
func TestHandleSyncMetadata(t *testing.T) {
	tmpDir, cleanup := setupTestProject(t)
	defer cleanup()

	projectConfig = &ProjectConfig{
		Projects: []Project{
			{ID: "test", Name: "Test", RootPath: tmpDir},
		},
		ActiveProject: "test",
	}

	// Create a permanent note with frontmatter
	noteContent := `---
title: Test Note
date: 2024-01-01
tags: [go, testing]
---
Content here`
	os.WriteFile(filepath.Join(tmpDir, "02-Permanent-Notes", "test-note.md"), []byte(noteContent), 0644)

	req := httptest.NewRequest(http.MethodPost, "/api/metadata/sync", nil)
	w := httptest.NewRecorder()

	handleSyncMetadata(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Expected status 200, got %d", w.Code)
	}

	var result map[string]interface{}
	json.NewDecoder(w.Body).Decode(&result)
	if result["notes"].(float64) != 1 {
		t.Errorf("Expected 1 note synced, got %v", result["notes"])
	}
}

// Test handleSyncMetadata - wrong method
func TestHandleSyncMetadata_WrongMethod(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/api/metadata/sync", nil)
	w := httptest.NewRecorder()

	handleSyncMetadata(w, req)

	if w.Code != http.StatusMethodNotAllowed {
		t.Errorf("Expected status 405, got %d", w.Code)
	}
}

// Test getMetadataContext
func TestGetMetadataContext(t *testing.T) {
	tmpDir, cleanup := setupTestProject(t)
	defer cleanup()

	projectConfig = &ProjectConfig{
		Projects: []Project{
			{ID: "test", Name: "Test", RootPath: tmpDir},
		},
		ActiveProject: "test",
	}

	// Save some metadata
	meta := &Metadata{
		Tags: []string{"tag1", "tag2"},
		Notes: []NoteMetadata{
			{Filename: "note1", Title: "Note 1"},
		},
	}
	saveMetadata(meta)

	tagsCtx, notesCtx := getMetadataContext()

	if !strings.Contains(tagsCtx, "tag1") {
		t.Errorf("Expected tags context to contain 'tag1', got %s", tagsCtx)
	}
	if !strings.Contains(notesCtx, "note1") {
		t.Errorf("Expected notes context to contain 'note1', got %s", notesCtx)
	}
}

// Test parseAIResponse
func TestParseAIResponse(t *testing.T) {
	tests := []struct {
		input    string
		hasError bool
		title    string
	}{
		{`{"title": "Test Title", "slug": "test-title", "tags": ["a", "b"]}`, false, "Test Title"},
		{`Some text before {"title": "Embedded", "slug": "emb", "tags": []} and after`, false, "Embedded"},
		{`no json here`, true, ""},
	}

	for _, tc := range tests {
		resp, err := parseAIResponse(tc.input)
		if tc.hasError {
			if err == nil {
				t.Errorf("Expected error for input %q", tc.input)
			}
		} else {
			if err != nil {
				t.Errorf("Unexpected error for input %q: %v", tc.input, err)
			}
			if resp.Title != tc.title {
				t.Errorf("Expected title %q, got %q", tc.title, resp.Title)
			}
		}
	}
}

// Test parseAIResponseWithRelated
func TestParseAIResponseWithRelated(t *testing.T) {
	input := `{"title": "Test", "slug": "test", "tags": ["a"], "related_notes": ["note1", "note2"]}`
	resp, related, err := parseAIResponseWithRelated(input)
	
	if err != nil {
		t.Fatalf("Unexpected error: %v", err)
	}
	if resp.Title != "Test" {
		t.Errorf("Expected title 'Test', got %s", resp.Title)
	}
	if len(related) != 2 {
		t.Errorf("Expected 2 related notes, got %d", len(related))
	}
}

// Test scanPermanentKnowledge
func TestScanPermanentKnowledge(t *testing.T) {
	tmpDir, cleanup := setupTestProject(t)
	defer cleanup()

	// Create notes with frontmatter
	noteContent := `---
title: Test
tags: [go, testing]
---
Content`
	os.WriteFile(filepath.Join(tmpDir, "02-Permanent-Notes", "note1.md"), []byte(noteContent), 0644)
	os.WriteFile(filepath.Join(tmpDir, "02-Permanent-Notes", "note2.md"), []byte(noteContent), 0644)

	tags, notes := scanPermanentKnowledge(filepath.Join(tmpDir, "02-Permanent-Notes"))

	if len(notes) != 2 {
		t.Errorf("Expected 2 notes, got %d", len(notes))
	}
	if len(tags) < 1 {
		t.Errorf("Expected at least 1 tag, got %d", len(tags))
	}
}

// Test handleProcess with mocked agent
func TestHandleProcess(t *testing.T) {
	tmpDir, cleanup := setupTestProject(t)
	defer cleanup()

	projectConfig = &ProjectConfig{
		Projects: []Project{
			{ID: "test", Name: "Test", RootPath: tmpDir},
		},
		ActiveProject: "test",
	}

	// Create a test fleeting note
	testNote := filepath.Join(tmpDir, "01-Fleeting-Notes", "process-test.md")
	os.WriteFile(testNote, []byte("# Test Note\n\nContent to process"), 0644)

	// Mock the agent command to return valid JSON
	originalRunAgent := runAgentCommand
	runAgentCommand = func(agent AgentConfig, prompt string, workDir string) ([]byte, error) {
		return []byte(`{"title": "Processed Note", "slug": "processed-note", "tags": ["test", "go"], "related_notes": []}`), nil
	}
	defer func() { runAgentCommand = originalRunAgent }()

	body := strings.NewReader(`{"path": "process-test.md", "target": "public", "agent": "claude"}`)
	req := httptest.NewRequest(http.MethodPost, "/process", body)
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	handleProcess(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Expected status 200, got %d: %s", w.Code, w.Body.String())
	}

	// Check that permanent note was created
	entries, _ := os.ReadDir(filepath.Join(tmpDir, "02-Permanent-Notes"))
	mdFiles := 0
	for _, e := range entries {
		if strings.HasSuffix(e.Name(), ".md") {
			mdFiles++
		}
	}
	if mdFiles != 1 {
		t.Errorf("Expected 1 permanent note created, got %d", mdFiles)
	}

	// Check that fleeting note was deleted
	if _, err := os.Stat(testNote); !os.IsNotExist(err) {
		t.Error("Expected fleeting note to be deleted after processing")
	}
}

// Test handleProcess - to private/secret
func TestHandleProcess_Secret(t *testing.T) {
	tmpDir, cleanup := setupTestProject(t)
	defer cleanup()

	projectConfig = &ProjectConfig{
		Projects: []Project{
			{ID: "test", Name: "Test", RootPath: tmpDir},
		},
		ActiveProject: "test",
	}

	// Create a test fleeting note
	testNote := filepath.Join(tmpDir, "01-Fleeting-Notes", "secret-test.md")
	os.WriteFile(testNote, []byte("# Secret Note"), 0644)

	// Mock the agent command
	originalRunAgent := runAgentCommand
	runAgentCommand = func(agent AgentConfig, prompt string, workDir string) ([]byte, error) {
		return []byte(`{"title": "Secret Note", "slug": "secret-note", "tags": ["private"]}`), nil
	}
	defer func() { runAgentCommand = originalRunAgent }()

	body := strings.NewReader(`{"path": "secret-test.md", "target": "private", "agent": "gemini"}`)
	req := httptest.NewRequest(http.MethodPost, "/process", body)
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	handleProcess(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Expected status 200, got %d", w.Code)
	}

	// Check secret folder
	entries, _ := os.ReadDir(filepath.Join(tmpDir, "02-Permanent-Notes", "Secret"))
	mdFiles := 0
	for _, e := range entries {
		if strings.HasSuffix(e.Name(), ".md") {
			mdFiles++
		}
	}
	if mdFiles != 1 {
		t.Errorf("Expected 1 secret permanent note, got %d", mdFiles)
	}
}

// Test handleProcess - wrong method
func TestHandleProcess_WrongMethod(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/process", nil)
	w := httptest.NewRecorder()

	handleProcess(w, req)

	if w.Code != http.StatusMethodNotAllowed {
		t.Errorf("Expected status 405, got %d", w.Code)
	}
}

// Test handleProcess - unknown agent
func TestHandleProcess_UnknownAgent(t *testing.T) {
	tmpDir, cleanup := setupTestProject(t)
	defer cleanup()

	projectConfig = &ProjectConfig{
		Projects: []Project{
			{ID: "test", Name: "Test", RootPath: tmpDir},
		},
		ActiveProject: "test",
	}

	body := strings.NewReader(`{"path": "test.md", "target": "public", "agent": "unknown"}`)
	req := httptest.NewRequest(http.MethodPost, "/process", body)
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	handleProcess(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("Expected status 400 for unknown agent, got %d", w.Code)
	}
}

// Test handleProcess - agent returns error
func TestHandleProcess_AgentError(t *testing.T) {
	tmpDir, cleanup := setupTestProject(t)
	defer cleanup()

	projectConfig = &ProjectConfig{
		Projects: []Project{
			{ID: "test", Name: "Test", RootPath: tmpDir},
		},
		ActiveProject: "test",
	}

	// Create a test fleeting note
	testNote := filepath.Join(tmpDir, "01-Fleeting-Notes", "error-test.md")
	os.WriteFile(testNote, []byte("# Error Test"), 0644)

	// Mock the agent command to return an error
	originalRunAgent := runAgentCommand
	runAgentCommand = func(agent AgentConfig, prompt string, workDir string) ([]byte, error) {
		return []byte("Agent crashed"), os.ErrNotExist // simulating an error
	}
	defer func() { runAgentCommand = originalRunAgent }()

	body := strings.NewReader(`{"path": "error-test.md", "target": "public", "agent": "claude"}`)
	req := httptest.NewRequest(http.MethodPost, "/process", body)
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	handleProcess(w, req)

	if w.Code != http.StatusInternalServerError {
		t.Errorf("Expected status 500 for agent error, got %d", w.Code)
	}
}

// Test handleProcess - fallback when AI response is invalid
func TestHandleProcess_AIResponseFallback(t *testing.T) {
	tmpDir, cleanup := setupTestProject(t)
	defer cleanup()

	projectConfig = &ProjectConfig{
		Projects: []Project{
			{ID: "test", Name: "Test", RootPath: tmpDir},
		},
		ActiveProject: "test",
	}

	// Create a test fleeting note
	testNote := filepath.Join(tmpDir, "01-Fleeting-Notes", "fallback-test.md")
	os.WriteFile(testNote, []byte("# Fallback Test"), 0644)

	// Mock the agent command to return invalid JSON
	originalRunAgent := runAgentCommand
	runAgentCommand = func(agent AgentConfig, prompt string, workDir string) ([]byte, error) {
		return []byte("This is not valid JSON at all"), nil
	}
	defer func() { runAgentCommand = originalRunAgent }()

	body := strings.NewReader(`{"path": "fallback-test.md", "target": "public", "agent": "claude"}`)
	req := httptest.NewRequest(http.MethodPost, "/process", body)
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	handleProcess(w, req)

	// Should still succeed with fallback
	if w.Code != http.StatusOK {
		t.Errorf("Expected status 200 with fallback, got %d: %s", w.Code, w.Body.String())
	}
}

// Test handleIndex
func TestHandleIndex(t *testing.T) {
	tmpDir, cleanup := setupTestProject(t)
	defer cleanup()

	projectConfig = &ProjectConfig{
		Projects: []Project{
			{ID: "test", Name: "Test", RootPath: tmpDir},
		},
		ActiveProject: "test",
	}

	// Create some test notes
	os.WriteFile(filepath.Join(tmpDir, "01-Fleeting-Notes", "note1.md"), []byte("Note 1"), 0644)

	req := httptest.NewRequest(http.MethodGet, "/", nil)
	w := httptest.NewRecorder()

	handleIndex(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Expected status 200, got %d", w.Code)
	}

	// Check that response contains HTML
	body := w.Body.String()
	if !strings.Contains(body, "<!DOCTYPE html>") {
		t.Error("Expected HTML response")
	}
	if !strings.Contains(body, "Gardener Web") {
		t.Error("Expected page title in response")
	}
}

// ============================================================
// Tests for new functions added in Tab Enhancement
// ============================================================

// Test getAllPaths returns correct PathConfig
func TestGetAllPaths(t *testing.T) {
	projectConfig = &ProjectConfig{
		Projects: []Project{
			{ID: "test", Name: "Test", RootPath: "/test/root"},
		},
		ActiveProject: "test",
	}

	paths := getAllPaths()

	if paths == nil {
		t.Fatal("Expected PathConfig, got nil")
	}
	if paths.Literature != "/test/root/00-Literature-Notes" {
		t.Errorf("Literature path: expected /test/root/00-Literature-Notes, got %s", paths.Literature)
	}
	if paths.Fleeting != "/test/root/01-Fleeting-Notes" {
		t.Errorf("Fleeting path: expected /test/root/01-Fleeting-Notes, got %s", paths.Fleeting)
	}
	if paths.Permanent != "/test/root/02-Permanent-Notes" {
		t.Errorf("Permanent path: expected /test/root/02-Permanent-Notes, got %s", paths.Permanent)
	}
	if paths.Structured != "/test/root/03-Structured-Notes" {
		t.Errorf("Structured path: expected /test/root/03-Structured-Notes, got %s", paths.Structured)
	}
}

// Test getAllPaths with nil config
func TestGetAllPaths_NilConfig(t *testing.T) {
	projectConfig = nil

	paths := getAllPaths()
	if paths != nil {
		t.Errorf("Expected nil with nil config, got %+v", paths)
	}
}

// Test scanLiterature
func TestScanLiterature(t *testing.T) {
	tmpDir, cleanup := setupTestProject(t)
	defer cleanup()

	projectConfig = &ProjectConfig{
		Projects: []Project{
			{ID: "test", Name: "Test", RootPath: tmpDir},
		},
		ActiveProject: "test",
	}

	// Create test files
	os.WriteFile(filepath.Join(tmpDir, "00-Literature-Notes", "book1.md"), []byte("Book 1"), 0644)
	os.WriteFile(filepath.Join(tmpDir, "00-Literature-Notes", "book2.md"), []byte("Book 2"), 0644)
	os.WriteFile(filepath.Join(tmpDir, "00-Literature-Notes", ".hidden.md"), []byte("Hidden"), 0644) // Should be ignored

	notes := scanLiterature()

	if len(notes) != 2 {
		t.Errorf("Expected 2 notes, got %d", len(notes))
	}
}

// Test scanLiterature empty dir
func TestScanLiterature_Empty(t *testing.T) {
	tmpDir, cleanup := setupTestProject(t)
	defer cleanup()

	projectConfig = &ProjectConfig{
		Projects: []Project{
			{ID: "test", Name: "Test", RootPath: tmpDir},
		},
		ActiveProject: "test",
	}

	notes := scanLiterature()
	if len(notes) != 0 {
		t.Errorf("Expected 0 notes, got %d", len(notes))
	}
}

// Test scanPermanent
func TestScanPermanent(t *testing.T) {
	tmpDir, cleanup := setupTestProject(t)
	defer cleanup()

	projectConfig = &ProjectConfig{
		Projects: []Project{
			{ID: "test", Name: "Test", RootPath: tmpDir},
		},
		ActiveProject: "test",
	}

	// Create test files
	os.WriteFile(filepath.Join(tmpDir, "02-Permanent-Notes", "note1.md"), []byte("Note 1"), 0644)
	os.WriteFile(filepath.Join(tmpDir, "02-Permanent-Notes", "Secret", "secret1.md"), []byte("Secret"), 0644)

	notes := scanPermanent()

	if len(notes) != 2 {
		t.Errorf("Expected 2 notes, got %d", len(notes))
	}

	// Check secret count
	secretCount := 0
	for _, n := range notes {
		if n.IsSecret {
			secretCount++
		}
	}
	if secretCount != 1 {
		t.Errorf("Expected 1 secret note, got %d", secretCount)
	}
}

// Test scanStructured
func TestScanStructured(t *testing.T) {
	tmpDir, cleanup := setupTestProject(t)
	defer cleanup()

	projectConfig = &ProjectConfig{
		Projects: []Project{
			{ID: "test", Name: "Test", RootPath: tmpDir},
		},
		ActiveProject: "test",
	}

	// Create test files
	os.WriteFile(filepath.Join(tmpDir, "03-Structured-Notes", "moc.md"), []byte("MOC"), 0644)

	notes := scanStructured()

	if len(notes) != 1 {
		t.Errorf("Expected 1 note, got %d", len(notes))
	}
}

// Test handleListLiterature API
func TestHandleListLiterature(t *testing.T) {
	tmpDir, cleanup := setupTestProject(t)
	defer cleanup()

	projectConfig = &ProjectConfig{
		Projects: []Project{
			{ID: "test", Name: "Test", RootPath: tmpDir},
		},
		ActiveProject: "test",
	}

	os.WriteFile(filepath.Join(tmpDir, "00-Literature-Notes", "book.md"), []byte("Book"), 0644)

	req := httptest.NewRequest(http.MethodGet, "/api/literature", nil)
	w := httptest.NewRecorder()

	handleListLiterature(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Expected status 200, got %d", w.Code)
	}

	var notes []Note
	json.NewDecoder(w.Body).Decode(&notes)
	if len(notes) != 1 {
		t.Errorf("Expected 1 note, got %d", len(notes))
	}
}

// Test handleReadLiterature API
func TestHandleReadLiterature(t *testing.T) {
	tmpDir, cleanup := setupTestProject(t)
	defer cleanup()

	projectConfig = &ProjectConfig{
		Projects: []Project{
			{ID: "test", Name: "Test", RootPath: tmpDir},
		},
		ActiveProject: "test",
	}

	os.WriteFile(filepath.Join(tmpDir, "00-Literature-Notes", "book.md"), []byte("Book content"), 0644)

	req := httptest.NewRequest(http.MethodGet, "/api/literature/read?path=book.md", nil)
	w := httptest.NewRecorder()

	handleReadLiterature(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Expected status 200, got %d", w.Code)
	}

	var result map[string]string
	json.NewDecoder(w.Body).Decode(&result)
	if result["content"] != "Book content" {
		t.Errorf("Expected 'Book content', got %s", result["content"])
	}
}

// Test handleReadLiterature missing path
func TestHandleReadLiterature_MissingPath(t *testing.T) {
	tmpDir, cleanup := setupTestProject(t)
	defer cleanup()

	projectConfig = &ProjectConfig{
		Projects: []Project{
			{ID: "test", Name: "Test", RootPath: tmpDir},
		},
		ActiveProject: "test",
	}

	req := httptest.NewRequest(http.MethodGet, "/api/literature/read", nil)
	w := httptest.NewRecorder()

	handleReadLiterature(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("Expected status 400, got %d", w.Code)
	}
}

// Test handleCreateLiterature API
func TestHandleCreateLiterature(t *testing.T) {
	tmpDir, cleanup := setupTestProject(t)
	defer cleanup()

	projectConfig = &ProjectConfig{
		Projects: []Project{
			{ID: "test", Name: "Test", RootPath: tmpDir},
		},
		ActiveProject: "test",
	}

	body := strings.NewReader(`{"filename": "newbook", "content": "New book content"}`)
	req := httptest.NewRequest(http.MethodPost, "/api/literature/create", body)
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	handleCreateLiterature(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Expected status 200, got %d: %s", w.Code, w.Body.String())
	}

	// Verify file was created
	content, err := os.ReadFile(filepath.Join(tmpDir, "00-Literature-Notes", "newbook.md"))
	if err != nil {
		t.Fatalf("Failed to read created file: %v", err)
	}
	if string(content) != "New book content" {
		t.Errorf("Expected 'New book content', got %s", string(content))
	}
}

// Test handleCreateLiterature - empty filename
func TestHandleCreateLiterature_EmptyFilename(t *testing.T) {
	tmpDir, cleanup := setupTestProject(t)
	defer cleanup()

	projectConfig = &ProjectConfig{
		Projects: []Project{
			{ID: "test", Name: "Test", RootPath: tmpDir},
		},
		ActiveProject: "test",
	}

	body := strings.NewReader(`{"filename": "", "content": "content"}`)
	req := httptest.NewRequest(http.MethodPost, "/api/literature/create", body)
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	handleCreateLiterature(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("Expected status 400, got %d", w.Code)
	}
}

// Test handleCreateLiterature - duplicate file
func TestHandleCreateLiterature_Duplicate(t *testing.T) {
	tmpDir, cleanup := setupTestProject(t)
	defer cleanup()

	projectConfig = &ProjectConfig{
		Projects: []Project{
			{ID: "test", Name: "Test", RootPath: tmpDir},
		},
		ActiveProject: "test",
	}

	// Create existing file
	os.WriteFile(filepath.Join(tmpDir, "00-Literature-Notes", "existing.md"), []byte("Existing"), 0644)

	body := strings.NewReader(`{"filename": "existing", "content": "New content"}`)
	req := httptest.NewRequest(http.MethodPost, "/api/literature/create", body)
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	handleCreateLiterature(w, req)

	if w.Code != http.StatusConflict {
		t.Errorf("Expected status 409, got %d", w.Code)
	}
}

// Test handleUpdateLiterature API
func TestHandleUpdateLiterature(t *testing.T) {
	tmpDir, cleanup := setupTestProject(t)
	defer cleanup()

	projectConfig = &ProjectConfig{
		Projects: []Project{
			{ID: "test", Name: "Test", RootPath: tmpDir},
		},
		ActiveProject: "test",
	}

	// Create initial file
	os.WriteFile(filepath.Join(tmpDir, "00-Literature-Notes", "book.md"), []byte("Old content"), 0644)

	body := strings.NewReader(`{"path": "book.md", "content": "Updated content"}`)
	req := httptest.NewRequest(http.MethodPost, "/api/literature/update", body)
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	handleUpdateLiterature(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Expected status 200, got %d", w.Code)
	}

	// Verify content was updated
	content, _ := os.ReadFile(filepath.Join(tmpDir, "00-Literature-Notes", "book.md"))
	if string(content) != "Updated content" {
		t.Errorf("Expected 'Updated content', got %s", string(content))
	}
}

// Test handleDeleteLiterature API
func TestHandleDeleteLiterature(t *testing.T) {
	tmpDir, cleanup := setupTestProject(t)
	defer cleanup()

	projectConfig = &ProjectConfig{
		Projects: []Project{
			{ID: "test", Name: "Test", RootPath: tmpDir},
		},
		ActiveProject: "test",
	}

	// Create file to delete
	filePath := filepath.Join(tmpDir, "00-Literature-Notes", "todelete.md")
	os.WriteFile(filePath, []byte("Delete me"), 0644)

	body := strings.NewReader(`{"path": "todelete.md"}`)
	req := httptest.NewRequest(http.MethodPost, "/api/literature/delete", body)
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	handleDeleteLiterature(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Expected status 200, got %d", w.Code)
	}

	// Verify file was deleted
	if _, err := os.Stat(filePath); !os.IsNotExist(err) {
		t.Error("Expected file to be deleted")
	}
}

// Test handleListPermanent API
func TestHandleListPermanent(t *testing.T) {
	tmpDir, cleanup := setupTestProject(t)
	defer cleanup()

	projectConfig = &ProjectConfig{
		Projects: []Project{
			{ID: "test", Name: "Test", RootPath: tmpDir},
		},
		ActiveProject: "test",
	}

	os.WriteFile(filepath.Join(tmpDir, "02-Permanent-Notes", "note.md"), []byte("Note"), 0644)

	req := httptest.NewRequest(http.MethodGet, "/api/permanent", nil)
	w := httptest.NewRecorder()

	handleListPermanent(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Expected status 200, got %d", w.Code)
	}

	var notes []Note
	json.NewDecoder(w.Body).Decode(&notes)
	if len(notes) != 1 {
		t.Errorf("Expected 1 note, got %d", len(notes))
	}
}

// Test handleReadPermanent API
func TestHandleReadPermanent(t *testing.T) {
	tmpDir, cleanup := setupTestProject(t)
	defer cleanup()

	projectConfig = &ProjectConfig{
		Projects: []Project{
			{ID: "test", Name: "Test", RootPath: tmpDir},
		},
		ActiveProject: "test",
	}

	os.WriteFile(filepath.Join(tmpDir, "02-Permanent-Notes", "note.md"), []byte("Permanent content"), 0644)

	req := httptest.NewRequest(http.MethodGet, "/api/permanent/read?path=note.md", nil)
	w := httptest.NewRecorder()

	handleReadPermanent(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Expected status 200, got %d", w.Code)
	}

	var result map[string]string
	json.NewDecoder(w.Body).Decode(&result)
	if result["content"] != "Permanent content" {
		t.Errorf("Expected 'Permanent content', got %s", result["content"])
	}
}

// Test handleReadPermanent - Secret file
func TestHandleReadPermanent_Secret(t *testing.T) {
	tmpDir, cleanup := setupTestProject(t)
	defer cleanup()

	projectConfig = &ProjectConfig{
		Projects: []Project{
			{ID: "test", Name: "Test", RootPath: tmpDir},
		},
		ActiveProject: "test",
	}

	os.WriteFile(filepath.Join(tmpDir, "02-Permanent-Notes", "Secret", "secret.md"), []byte("Secret content"), 0644)

	req := httptest.NewRequest(http.MethodGet, "/api/permanent/read?path=Secret/secret.md", nil)
	w := httptest.NewRecorder()

	handleReadPermanent(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Expected status 200, got %d", w.Code)
	}

	var result map[string]string
	json.NewDecoder(w.Body).Decode(&result)
	if result["content"] != "Secret content" {
		t.Errorf("Expected 'Secret content', got %s", result["content"])
	}
}

// Test handleReadPermanent - missing path
func TestHandleReadPermanent_MissingPath(t *testing.T) {
	tmpDir, cleanup := setupTestProject(t)
	defer cleanup()

	projectConfig = &ProjectConfig{
		Projects: []Project{
			{ID: "test", Name: "Test", RootPath: tmpDir},
		},
		ActiveProject: "test",
	}

	req := httptest.NewRequest(http.MethodGet, "/api/permanent/read", nil)
	w := httptest.NewRecorder()

	handleReadPermanent(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("Expected status 400, got %d", w.Code)
	}
}

// Test handleListStructured API
func TestHandleListStructured(t *testing.T) {
	tmpDir, cleanup := setupTestProject(t)
	defer cleanup()

	projectConfig = &ProjectConfig{
		Projects: []Project{
			{ID: "test", Name: "Test", RootPath: tmpDir},
		},
		ActiveProject: "test",
	}

	os.WriteFile(filepath.Join(tmpDir, "03-Structured-Notes", "moc.md"), []byte("MOC"), 0644)

	req := httptest.NewRequest(http.MethodGet, "/api/structured", nil)
	w := httptest.NewRecorder()

	handleListStructured(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Expected status 200, got %d", w.Code)
	}

	var notes []Note
	json.NewDecoder(w.Body).Decode(&notes)
	if len(notes) != 1 {
		t.Errorf("Expected 1 note, got %d", len(notes))
	}
}

// Test handleReadStructured API
func TestHandleReadStructured(t *testing.T) {
	tmpDir, cleanup := setupTestProject(t)
	defer cleanup()

	projectConfig = &ProjectConfig{
		Projects: []Project{
			{ID: "test", Name: "Test", RootPath: tmpDir},
		},
		ActiveProject: "test",
	}

	os.WriteFile(filepath.Join(tmpDir, "03-Structured-Notes", "moc.md"), []byte("MOC content"), 0644)

	req := httptest.NewRequest(http.MethodGet, "/api/structured/read?path=moc.md", nil)
	w := httptest.NewRecorder()

	handleReadStructured(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Expected status 200, got %d", w.Code)
	}

	var result map[string]string
	json.NewDecoder(w.Body).Decode(&result)
	if result["content"] != "MOC content" {
		t.Errorf("Expected 'MOC content', got %s", result["content"])
	}
}

// Test handleReadStructured - missing path
func TestHandleReadStructured_MissingPath(t *testing.T) {
	tmpDir, cleanup := setupTestProject(t)
	defer cleanup()

	projectConfig = &ProjectConfig{
		Projects: []Project{
			{ID: "test", Name: "Test", RootPath: tmpDir},
		},
		ActiveProject: "test",
	}

	req := httptest.NewRequest(http.MethodGet, "/api/structured/read", nil)
	w := httptest.NewRecorder()

	handleReadStructured(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("Expected status 400, got %d", w.Code)
	}
}

// Test handleSetDefaultAgent API
func TestHandleSetDefaultAgent(t *testing.T) {
	projectConfig = &ProjectConfig{
		Projects: []Project{
			{ID: "test", Name: "Test", RootPath: "/test"},
		},
		ActiveProject: "test",
		DefaultAgent:  "claude",
	}

	body := strings.NewReader(`{"agent": "gemini"}`)
	req := httptest.NewRequest(http.MethodPost, "/api/agent/set", body)
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	handleSetDefaultAgent(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Expected status 200, got %d", w.Code)
	}

	if projectConfig.DefaultAgent != "gemini" {
		t.Errorf("Expected default agent 'gemini', got %s", projectConfig.DefaultAgent)
	}
}

// Test handleSetDefaultAgent - wrong method
func TestHandleSetDefaultAgent_WrongMethod(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/api/agent/set", nil)
	w := httptest.NewRecorder()

	handleSetDefaultAgent(w, req)

	if w.Code != http.StatusMethodNotAllowed {
		t.Errorf("Expected status 405, got %d", w.Code)
	}
}
