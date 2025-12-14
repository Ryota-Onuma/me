package main

import (
	"encoding/json"
	"fmt"
	"html/template"
	"log"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"regexp"
	"strings"
	"time"
)

// --- 設定 ---
const (
	Port              = "56789"
	ProjectConfigFile = "projects.json"
)

// --- プロジェクト設定 ---
type Project struct {
	ID       string `json:"id"`       // Unique identifier (slug)
	Name     string `json:"name"`     // Display name
	RootPath string `json:"rootPath"` // Absolute path to memory root
}

type ProjectConfig struct {
	Projects      []Project `json:"projects"`
	ActiveProject string    `json:"activeProject"` // ID of current project
	DefaultAgent  string    `json:"defaultAgent"`  // Default agent (claude/gemini/codex)
}

var projectConfig *ProjectConfig


func loadProjectConfig() error {
	data, err := os.ReadFile(ProjectConfigFile)
	if err != nil {
		if os.IsNotExist(err) {
			// 初回起動: デフォルトプロジェクトを作成
			wd, _ := os.Getwd()
			defaultRoot := filepath.Join(wd, "../..")
			absRoot, _ := filepath.Abs(defaultRoot)
			
			projectConfig = &ProjectConfig{
				Projects: []Project{
					{
						ID:       "default",
						Name:     "Default",
						RootPath: absRoot,
					},
				},
				ActiveProject: "default",
				DefaultAgent:  "claude",
			}
			return saveProjectConfig()
		}
		return err
	}

	projectConfig = &ProjectConfig{}
	return json.Unmarshal(data, projectConfig)
}


func saveProjectConfig() error {
	data, err := json.MarshalIndent(projectConfig, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(ProjectConfigFile, data, 0644)
}


func getActiveProject() *Project {
	if projectConfig == nil {
		return nil
	}
	for i := range projectConfig.Projects {
		if projectConfig.Projects[i].ID == projectConfig.ActiveProject {
			return &projectConfig.Projects[i]
		}
	}
	// フォールバック: 最初のプロジェクト
	if len(projectConfig.Projects) > 0 {
		return &projectConfig.Projects[0]
	}
	return nil
}

// PathConfig holds all the directory paths for a project
type PathConfig struct {
	Literature      string
	Fleeting        string
	FleetingSecret  string
	Permanent       string
	PermanentSecret string
	Structured      string
	Metadata        string
}

// 動的パス解決（全パス）
func getAllPaths() *PathConfig {
	project := getActiveProject()
	if project == nil {
		return nil
	}
	root := project.RootPath
	return &PathConfig{
		Literature:      filepath.Join(root, "00-Literature-Notes"),
		Fleeting:        filepath.Join(root, "01-Fleeting-Notes"),
		FleetingSecret:  filepath.Join(root, "01-Fleeting-Notes/Secret"),
		Permanent:       filepath.Join(root, "02-Permanent-Notes"),
		PermanentSecret: filepath.Join(root, "02-Permanent-Notes/Secret"),
		Structured:      filepath.Join(root, "03-Structured-Notes"),
		Metadata:        filepath.Join(root, "91_Metadata/metadata.json"),
	}
}

// 動的パス解決 (後方互換性のため維持)
func getPaths() (fleeting, fleetSecret, permanent, permSecret, metadata string) {
	paths := getAllPaths()
	if paths == nil {
		return "", "", "", "", ""
	}
	return paths.Fleeting, paths.FleetingSecret, paths.Permanent, paths.PermanentSecret, paths.Metadata
}

// --- エージェント設定 ---
type AgentConfig struct {
	Name    string   // 表示名
	Command string   // CLIコマンド
	Args    []string // 追加の引数（プロンプト前に付与）
}

var agents = map[string]AgentConfig{
	"claude": {
		Name:    "Claude",
		Command: "claude",
		Args:    []string{"-p"},
	},
	"gemini": {
		Name:    "Gemini",
		Command: "gemini",
		Args:    []string{"-p"},
	},
	"codex": {
		Name:    "Codex",
		Command: "codex",
		Args:    []string{"-p"},
	},
}

// runAgentCommand is a mockable function for executing agent commands
// In tests, this can be replaced with a mock function
var runAgentCommand = func(agent AgentConfig, prompt string, workDir string) ([]byte, error) {
	args := append(agent.Args, prompt)
	cmd := exec.Command(agent.Command, args...)
	cmd.Dir = workDir
	return cmd.CombinedOutput()
}

// --- データ構造 ---
type Note struct {
	Path     string // 相対パス (例: Secret/memo.md)
	Filename string // 表示名
	IsSecret bool   // Secretフォルダにあるか
}


type AIResponse struct {
	Title string   `json:"title"`
	Slug  string   `json:"slug"`
	Tags  []string `json:"tags"`
}


type NoteMetadata struct {
	Filename     string   `json:"filename"`
	Title        string   `json:"title"`
	Date         string   `json:"date"`
	Tags         []string `json:"tags"`
	RelatedNotes []string `json:"related_notes,omitempty"`
	IsSecret     bool     `json:"is_secret"`
}

type Metadata struct {
	Tags        []string       `json:"tags"`
	Notes       []NoteMetadata `json:"notes"`
	LastUpdated string         `json:"lastUpdated"`
}

// --- メイン処理 ---
func main() {
	if err := loadProjectConfig(); err != nil {
		log.Fatalf("Failed to load project config: %v", err)
	}


	http.HandleFunc("/", handleIndex)
	http.HandleFunc("/process", handleProcess)
	http.HandleFunc("/create", handleCreate)
	

	http.HandleFunc("/api/inbox/read", handleReadInbox)
	http.HandleFunc("/api/inbox/update", handleUpdateInbox)
	http.HandleFunc("/api/inbox/delete", handleDeleteInbox)
	

	http.HandleFunc("/api/metadata", handleGetMetadata)
	http.HandleFunc("/api/metadata/add", handleAddMetadata)
	http.HandleFunc("/api/metadata/sync", handleSyncMetadata)


	http.HandleFunc("/api/projects", handleGetProjects)
	http.HandleFunc("/api/projects/create", handleCreateProject)
	http.HandleFunc("/api/projects/switch", handleSwitchProject)
	http.HandleFunc("/api/projects/delete", handleDeleteProject)
	http.HandleFunc("/api/agent/set", handleSetDefaultAgent)


	http.HandleFunc("/api/literature", handleListLiterature)
	http.HandleFunc("/api/literature/read", handleReadLiterature)
	http.HandleFunc("/api/literature/update", handleUpdateLiterature)
	http.HandleFunc("/api/literature/create", handleCreateLiterature)
	http.HandleFunc("/api/literature/delete", handleDeleteLiterature)


	http.HandleFunc("/api/permanent", handleListPermanent)
	http.HandleFunc("/api/permanent/read", handleReadPermanent)


	http.HandleFunc("/api/structured", handleListStructured)
	http.HandleFunc("/api/structured/read", handleReadStructured)

	project := getActiveProject()
	projectName := "Unknown"
	if project != nil {
		projectName = project.Name
	}

	fmt.Printf("🌱 Gardener Web is running at http://localhost:%s\n", Port)
	fmt.Printf("📂 Active Project: %s\n", projectName)
	fmt.Println("⚠️  Make sure your selected agent CLI is logged in and available in PATH.")
	fmt.Println("   Supported agents: claude, gemini, codex")
	fmt.Println("")
	fmt.Println("📁 Watching:")
	fmt.Println("   - 01-Fleeting-Notes/ (Public)")
	fmt.Println("   - 01-Fleeting-Notes/Secret/ (Private)")
	fmt.Println("")
	fmt.Println("🔧 API Endpoints:")
	fmt.Println("   GET  /api/metadata      - Get all metadata")
	fmt.Println("   POST /api/metadata/add  - Add note metadata")
	fmt.Println("   POST /api/metadata/sync - Sync from files")
	fmt.Println("   GET  /api/projects      - List projects")
	fmt.Println("   POST /api/projects/*    - Manage projects")

	if err := http.ListenAndServe(":"+Port, nil); err != nil {
		log.Fatal(err)
	}
}

// --- ハンドラー: 一覧表示 ---
func handleIndex(w http.ResponseWriter, r *http.Request) {
	notes := scanFleeting()
	tmpl, err := template.New("index").Parse(htmlTemplate)
	if err != nil {
		http.Error(w, err.Error(), 500)
		return
	}
	tmpl.Execute(w, notes)
}

// --- ハンドラー: 新規ノート作成 ---
func handleCreate(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", 405)
		return
	}

	var req struct {
		Content  string `json:"content"`  // ノート内容
		IsSecret bool   `json:"isSecret"` // Secretに保存するか
		Agent    string `json:"agent"`    // 使用するエージェント
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid JSON", 400)
		return
	}

	if strings.TrimSpace(req.Content) == "" {
		http.Error(w, "Content is required", 400)
		return
	}

	// 保存先を決定 (Inbox = Fleeting Notes)
	dirFleeting, dirFleetSecret, _, _, _ := getPaths()
	destDir := dirFleeting
	if req.IsSecret {
		destDir = dirFleetSecret
	}

	// シンプルにタイムスタンプベースのファイル名を生成
	now := time.Now()
	baseFilename := now.Format("2006-01-02-150405")
	newFilename := baseFilename + ".md"
	newPath := filepath.Join(destDir, newFilename)

	// 同名ファイルが存在する場合は連番を付ける
	counter := 1
	for {
		if _, err := os.Stat(newPath); os.IsNotExist(err) {
			break
		}
		newFilename = fmt.Sprintf("%s-%d.md", baseFilename, counter)
		newPath = filepath.Join(destDir, newFilename)
		counter++
	}

	// Inboxはシンプルに内容だけ保存（Frontmatterなし）
	newContent := req.Content

	// 宛先ディレクトリが存在することを確認
	if err := os.MkdirAll(destDir, 0755); err != nil {
		http.Error(w, "Failed to create destination directory: "+err.Error(), 500)
		return
	}

	// 新しいファイルを作成
	if err := os.WriteFile(newPath, []byte(newContent), 0644); err != nil {
		http.Error(w, "Failed to write file: "+err.Error(), 500)
		return
	}

	location := "Public"
	if req.IsSecret {
		location = "Secret"
	}
	log.Printf("✅ Created new note: %s (%s)", newPath, location)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(200)
	json.NewEncoder(w).Encode(map[string]string{
		"filename": newFilename,
		"path":     newPath,
	})
}

// --- ハンドラー: Inbox ファイル読み取り ---
func handleReadInbox(w http.ResponseWriter, r *http.Request) {
	path := r.URL.Query().Get("path")
	if path == "" {
		http.Error(w, "path is required", 400)
		return
	}

	// セキュリティ: パスがFleeting Notes内に限定されていることを確認
	dirFleeting, _, _, _, _ := getPaths()
	targetFile := filepath.Join(dirFleeting, path)

	content, err := os.ReadFile(targetFile)
	if err != nil {
		http.Error(w, "Failed to read file: "+err.Error(), 404)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"path":    path,
		"content": string(content),
	})
}

// --- ハンドラー: Inbox ファイル更新 ---
func handleUpdateInbox(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", 405)
		return
	}

	var req struct {
		Path    string `json:"path"`
		Content string `json:"content"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid JSON", 400)
		return
	}

	dirFleeting, _, _, _, _ := getPaths()
	targetFile := filepath.Join(dirFleeting, req.Path)

	if err := os.WriteFile(targetFile, []byte(req.Content), 0644); err != nil {
		http.Error(w, "Failed to write file: "+err.Error(), 500)
		return
	}

	log.Printf("✏️ Updated inbox file: %s", req.Path)
	w.WriteHeader(200)
	json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
}

// --- ハンドラー: Inbox ファイル削除 ---
func handleDeleteInbox(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", 405)
		return
	}

	var req struct {
		Path string `json:"path"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid JSON", 400)
		return
	}

	dirFleeting, _, _, _, _ := getPaths()
	targetFile := filepath.Join(dirFleeting, req.Path)

	if err := os.Remove(targetFile); err != nil {
		http.Error(w, "Failed to delete file: "+err.Error(), 500)
		return
	}

	log.Printf("🗑 Deleted inbox file: %s", req.Path)
	w.WriteHeader(200)
	json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
}

// --- ハンドラー: 処理実行 (エージェント起動) ---
func handleProcess(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", 405)
		return
	}

	var req struct {
		Path   string `json:"path"`   // 対象ファイル (例: Secret/memo.md)
		Target string `json:"target"` // "public" or "private"
		Agent  string `json:"agent"`  // "claude", "gemini", or "codex"
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid JSON", 400)
		return
	}

	// エージェント設定の取得
	agent, ok := agents[req.Agent]
	if !ok {
		http.Error(w, "Unknown agent: "+req.Agent, 400)
		return
	}

	// パスの解決
	dirFleeting, _, dirPermanent, dirPermSecret, _ := getPaths()
	targetFile := filepath.Join(dirFleeting, req.Path)
	destDir := dirPermanent
	if req.Target == "private" {
		destDir = dirPermSecret
	}

	// ファイル内容を読み込む
	content, err := os.ReadFile(targetFile)
	if err != nil {
		http.Error(w, "Failed to read file: "+err.Error(), 500)
		return
	}

	// メタデータ(一次ソース)からタグとファイル一覧を取得
	tagsContext, notesContext := getMetadataContext()

	// プロンプトの構築 (メタデータ生成 + 関連リンク提案)
	prompt := fmt.Sprintf(`
あなたはZettelkastenナレッジマネージャーです。
以下のMarkdownファイルの内容を分析して、JSON形式でメタデータを返してください。
必ず以下の形式の有効なJSONのみを出力してください。説明や追加テキストは不要です。

{
  "title": "日本語のタイトル",
  "slug": "english-slug-for-filename",
  "tags": ["tag1", "tag2"],
  "related_notes": ["関連ノートのファイル名（拡張子なし）"]
}

%s
%s
---ファイル内容---
%s
`, tagsContext, notesContext, string(content))

	// エージェント実行
	log.Printf("🤖 Running %s Agent for metadata extraction: %s", agent.Name, req.Path)

	// アクティブプロジェクトのルートディレクトリで実行
	workDir := ""
	project := getActiveProject()
	if project != nil {
		workDir = project.RootPath
	}

	output, err := runAgentCommand(agent, prompt, workDir)
	if err != nil {
		log.Printf("❌ %s Agent Error: %v\nOutput: %s", agent.Name, err, string(output))
		http.Error(w, fmt.Sprintf("Agent failed: %s", string(output)), 500)
		return
	}

	log.Printf("📝 AI Response: %s", string(output))

	// JSONを抽出して解析
	aiResp, relatedNotes, err := parseAIResponseWithRelated(string(output))
	if err != nil {
		log.Printf("⚠️ Failed to parse AI response, using fallback: %v", err)
		// フォールバック: ファイル名からタイトルを生成
		baseName := strings.TrimSuffix(filepath.Base(req.Path), ".md")
		aiResp = &AIResponse{
			Title: baseName,
			Slug:  slugify(baseName),
			Tags:  []string{"fleeting"},
		}
		relatedNotes = []string{}
	}

	// ファイル操作をGoで実行
	today := time.Now().Format("2006-01-02")
	newFilename := fmt.Sprintf("%s-%s.md", today, aiResp.Slug)
	newPath := filepath.Join(destDir, newFilename)

	// Frontmatterを追加
	tagsStr := ""
	for i, tag := range aiResp.Tags {
		if i > 0 {
			tagsStr += ", "
		}
		tagsStr += tag
	}

	// 本文を構築（関連リンクを追加）
	bodyContent := string(content)
	if len(relatedNotes) > 0 {
		bodyContent += "\n\n## Related\n"
		for _, note := range relatedNotes {
			bodyContent += fmt.Sprintf("- [[%s]]\n", note)
		}
	}

	newContent := fmt.Sprintf(`---
title: %s
date: %s
tags: [%s]
---
%s`, aiResp.Title, today, tagsStr, bodyContent)

	// 宛先ディレクトリが存在することを確認
	if err := os.MkdirAll(destDir, 0755); err != nil {
		http.Error(w, "Failed to create destination directory: "+err.Error(), 500)
		return
	}

	// 新しいファイルを作成
	if err := os.WriteFile(newPath, []byte(newContent), 0644); err != nil {
		http.Error(w, "Failed to write file: "+err.Error(), 500)
		return
	}

	// 元のファイルを削除
	if err := os.Remove(targetFile); err != nil {
		log.Printf("⚠️ Warning: Failed to remove original file: %v", err)
	}

	// --- メタデータを更新 ---
	newNoteMeta := NoteMetadata{
		Filename:     strings.TrimSuffix(filepath.Base(newPath), ".md"),
		Title:        aiResp.Title,
		Date:         today,
		Tags:         aiResp.Tags,
		RelatedNotes: relatedNotes,
		IsSecret:     req.Target == "private",
	}
	
	meta, _ := loadMetadata()
	if meta != nil {
		// 既存のノートを更新または追加
		found := false
		for i, note := range meta.Notes {
			if note.Filename == newNoteMeta.Filename {
				meta.Notes[i] = newNoteMeta
				found = true
				break
			}
		}
		if !found {
			meta.Notes = append(meta.Notes, newNoteMeta)
		}
		
		// タグを更新（重複除去）
		tagSet := make(map[string]bool)
		for _, t := range meta.Tags {
			tagSet[t] = true
		}
		for _, t := range newNoteMeta.Tags {
			tagSet[t] = true
		}
		meta.Tags = make([]string, 0, len(tagSet))
		for t := range tagSet {
			meta.Tags = append(meta.Tags, t)
		}
		
		saveMetadata(meta)
		log.Printf("📝 Metadata updated: %s", newNoteMeta.Filename)
	}

	log.Printf("✅ Success: %s -> %s (with %d related links)", req.Path, newPath, len(relatedNotes))
	w.WriteHeader(200)
	w.Write([]byte("OK"))
}

// --- ユーティリティ: Permanent Notes からタグとファイル一覧を収集 ---
func scanPermanentKnowledge(destDir string) (tags []string, notes []string) {
	tagSet := make(map[string]bool)
	
	// 指定ディレクトリ内のファイルを走査
	entries, _ := os.ReadDir(destDir)
	for _, e := range entries {
		if e.IsDir() || !strings.HasSuffix(e.Name(), ".md") || strings.HasPrefix(e.Name(), ".") {
			continue
		}
		
		// ファイル名を記録（拡張子なし）
		noteName := strings.TrimSuffix(e.Name(), ".md")
		notes = append(notes, noteName)
		
		// ファイル内容からタグを抽出
		filePath := filepath.Join(destDir, e.Name())
		content, err := os.ReadFile(filePath)
		if err != nil {
			continue
		}
		
		// YAML Frontmatterからタグを抽出
		contentStr := string(content)
		if strings.HasPrefix(contentStr, "---") {
			parts := strings.SplitN(contentStr, "---", 3)
			if len(parts) >= 2 {
				frontmatter := parts[1]
				// tags: [tag1, tag2] または tags: ["tag1", "tag2"] をパース
				tagPattern := regexp.MustCompile(`tags:\s*\[([^\]]*)\]`)
				match := tagPattern.FindStringSubmatch(frontmatter)
				if len(match) > 1 {
					tagList := strings.Split(match[1], ",")
					for _, t := range tagList {
						t = strings.TrimSpace(t)
						t = strings.Trim(t, `"'`)
						if t != "" {
							tagSet[t] = true
						}
					}
				}
			}
		}
	}
	
	// mapをsliceに変換
	for t := range tagSet {
		tags = append(tags, t)
	}
	
	return tags, notes
}

// --- メタデータAPI関連 ---

// メタデータの読み込み
func loadMetadata() (*Metadata, error) {
	_, _, _, _, metadataFile := getPaths()
	data, err := os.ReadFile(metadataFile)
	if err != nil {
		if os.IsNotExist(err) {
			return &Metadata{Tags: []string{}, Notes: []NoteMetadata{}, LastUpdated: ""}, nil
		}
		return nil, err
	}
	
	var meta Metadata
	if err := json.Unmarshal(data, &meta); err != nil {
		return nil, err
	}
	return &meta, nil
}

// メタデータの保存
func saveMetadata(meta *Metadata) error {
	_, _, _, _, metadataFile := getPaths()
	// メタデータディレクトリが存在することを確認
	metaDir := filepath.Dir(metadataFile)
	if err := os.MkdirAll(metaDir, 0755); err != nil {
		return err
	}
	meta.LastUpdated = time.Now().Format("2006-01-02T15:04:05")
	data, err := json.MarshalIndent(meta, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(metadataFile, data, 0644)
}

// GET /api/metadata - メタデータ取得
func handleGetMetadata(w http.ResponseWriter, r *http.Request) {
	meta, err := loadMetadata()
	if err != nil {
		http.Error(w, "Failed to load metadata: "+err.Error(), 500)
		return
	}
	
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(meta)
}

// POST /api/metadata/add - 新規ノートメタデータ追加
func handleAddMetadata(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", 405)
		return
	}
	
	var newNote NoteMetadata
	if err := json.NewDecoder(r.Body).Decode(&newNote); err != nil {
		http.Error(w, "Invalid JSON: "+err.Error(), 400)
		return
	}
	
	meta, err := loadMetadata()
	if err != nil {
		http.Error(w, "Failed to load metadata: "+err.Error(), 500)
		return
	}
	
	// 既存のノートを更新または追加
	found := false
	for i, note := range meta.Notes {
		if note.Filename == newNote.Filename {
			meta.Notes[i] = newNote
			found = true
			break
		}
	}
	if !found {
		meta.Notes = append(meta.Notes, newNote)
	}
	
	// タグを更新（重複除去）
	tagSet := make(map[string]bool)
	for _, t := range meta.Tags {
		tagSet[t] = true
	}
	for _, t := range newNote.Tags {
		tagSet[t] = true
	}
	meta.Tags = make([]string, 0, len(tagSet))
	for t := range tagSet {
		meta.Tags = append(meta.Tags, t)
	}
	
	if err := saveMetadata(meta); err != nil {
		http.Error(w, "Failed to save metadata: "+err.Error(), 500)
		return
	}
	
	log.Printf("📝 Metadata added/updated: %s", newNote.Filename)
	w.WriteHeader(200)
	json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
}

// POST /api/metadata/sync - ファイルシステムからメタデータを同期
func handleSyncMetadata(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", 405)
		return
	}
	
	meta := &Metadata{
		Tags:  []string{},
		Notes: []NoteMetadata{},
	}
	tagSet := make(map[string]bool)
	
	// Public と Secret の両方をスキャン
	_, _, dirPermanent, dirPermSecret, _ := getPaths()
	dirs := []struct {
		path     string
		isSecret bool
	}{
		{dirPermanent, false},
		{dirPermSecret, true},
	}
	
	for _, dir := range dirs {
		entries, _ := os.ReadDir(dir.path)
		for _, e := range entries {
			if e.IsDir() || !strings.HasSuffix(e.Name(), ".md") || strings.HasPrefix(e.Name(), ".") {
				continue
			}
			
			filePath := filepath.Join(dir.path, e.Name())
			content, err := os.ReadFile(filePath)
			if err != nil {
				continue
			}
			
			noteMeta := NoteMetadata{
				Filename: strings.TrimSuffix(e.Name(), ".md"),
				IsSecret: dir.isSecret,
			}
			
			// Frontmatterをパース
			contentStr := string(content)
			if strings.HasPrefix(contentStr, "---") {
				parts := strings.SplitN(contentStr, "---", 3)
				if len(parts) >= 2 {
					fm := parts[1]
					
					// title
					if m := regexp.MustCompile(`title:\s*(.+)`).FindStringSubmatch(fm); len(m) > 1 {
						noteMeta.Title = strings.TrimSpace(m[1])
					}
					
					// date
					if m := regexp.MustCompile(`date:\s*(.+)`).FindStringSubmatch(fm); len(m) > 1 {
						noteMeta.Date = strings.TrimSpace(m[1])
					}
					
					// tags
					if m := regexp.MustCompile(`tags:\s*\[([^\]]*)\]`).FindStringSubmatch(fm); len(m) > 1 {
						tagList := strings.Split(m[1], ",")
						for _, t := range tagList {
							t = strings.TrimSpace(t)
							t = strings.Trim(t, `"'`)
							if t != "" {
								noteMeta.Tags = append(noteMeta.Tags, t)
								tagSet[t] = true
							}
						}
					}
				}
			}
			
			meta.Notes = append(meta.Notes, noteMeta)
		}
	}
	
	// タグを設定
	for t := range tagSet {
		meta.Tags = append(meta.Tags, t)
	}
	
	if err := saveMetadata(meta); err != nil {
		http.Error(w, "Failed to save metadata: "+err.Error(), 500)
		return
	}
	
	log.Printf("🔄 Metadata synced: %d notes, %d tags", len(meta.Notes), len(meta.Tags))
	w.WriteHeader(200)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"status": "ok",
		"notes":  len(meta.Notes),
		"tags":   len(meta.Tags),
	})
}

// --- プロジェクトAPI関連 ---

// GET /api/projects - プロジェクト一覧取得
func handleGetProjects(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(projectConfig)
}

// POST /api/projects/create - 新規プロジェクト作成
func handleCreateProject(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", 405)
		return
	}

	var req struct {
		Name     string `json:"name"`
		RootPath string `json:"rootPath"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid JSON", 400)
		return
	}

	if strings.TrimSpace(req.Name) == "" {
		http.Error(w, "Name is required", 400)
		return
	}
	if strings.TrimSpace(req.RootPath) == "" {
		http.Error(w, "RootPath is required", 400)
		return
	}

	// パスを絶対パスに変換
	// 相対パスの場合は brain/memory ディレクトリを基準にする
	var absPath string
	if filepath.IsAbs(req.RootPath) {
		absPath = req.RootPath
	} else {
		// gardener_web の2つ上 (brain/memory) を基準にする
		wd, _ := os.Getwd()
		memoryDir := filepath.Join(wd, "../..")
		absPath = filepath.Join(memoryDir, req.RootPath)
	}
	absPath, err := filepath.Abs(absPath)
	if err != nil {
		http.Error(w, "Invalid path: "+err.Error(), 400)
		return
	}

	// プロジェクトディレクトリ構造を作成
	dirs := []string{
		filepath.Join(absPath, "00-Literature-Notes"),
		filepath.Join(absPath, "01-Fleeting-Notes"),
		filepath.Join(absPath, "01-Fleeting-Notes/Secret"),
		filepath.Join(absPath, "02-Permanent-Notes"),
		filepath.Join(absPath, "02-Permanent-Notes/Secret"),
		filepath.Join(absPath, "03-Structured-Notes"),
		filepath.Join(absPath, "91_Metadata"),
	}
	for _, dir := range dirs {
		if err := os.MkdirAll(dir, 0755); err != nil {
			http.Error(w, "Failed to create directory: "+err.Error(), 500)
			return
		}
	}

	// 空のメタデータファイルを作成
	metadataFile := filepath.Join(absPath, "91_Metadata/metadata.json")
	if _, err := os.Stat(metadataFile); os.IsNotExist(err) {
		emptyMeta := Metadata{Tags: []string{}, Notes: []NoteMetadata{}, LastUpdated: ""}
		data, _ := json.MarshalIndent(emptyMeta, "", "  ")
		os.WriteFile(metadataFile, data, 0644)
	}

	// ID を生成 (name を slug 化)
	id := slugify(req.Name)
	
	// 重複チェック
	for _, p := range projectConfig.Projects {
		if p.ID == id {
			http.Error(w, "Project with this name already exists", 400)
			return
		}
	}

	newProject := Project{
		ID:       id,
		Name:     req.Name,
		RootPath: absPath,
	}

	projectConfig.Projects = append(projectConfig.Projects, newProject)
	if err := saveProjectConfig(); err != nil {
		http.Error(w, "Failed to save project config: "+err.Error(), 500)
		return
	}

	log.Printf("📂 Created new project: %s (%s)", req.Name, absPath)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": "ok", "id": id})
}

// POST /api/projects/switch - プロジェクト切り替え
func handleSwitchProject(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", 405)
		return
	}

	var req struct {
		ID string `json:"id"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid JSON", 400)
		return
	}

	// プロジェクトが存在するか確認
	found := false
	for _, p := range projectConfig.Projects {
		if p.ID == req.ID {
			found = true
			break
		}
	}
	if !found {
		http.Error(w, "Project not found", 404)
		return
	}

	projectConfig.ActiveProject = req.ID
	if err := saveProjectConfig(); err != nil {
		http.Error(w, "Failed to save project config: "+err.Error(), 500)
		return
	}

	project := getActiveProject()
	log.Printf("📂 Switched to project: %s (%s)", project.Name, project.RootPath)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
}

// POST /api/projects/delete - プロジェクト削除
func handleDeleteProject(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", 405)
		return
	}

	var req struct {
		ID string `json:"id"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid JSON", 400)
		return
	}

	// 最後のプロジェクトは削除できない
	if len(projectConfig.Projects) <= 1 {
		http.Error(w, "Cannot delete the last project", 400)
		return
	}

	// プロジェクトを削除
	found := false
	newProjects := []Project{}
	for _, p := range projectConfig.Projects {
		if p.ID == req.ID {
			found = true
		} else {
			newProjects = append(newProjects, p)
		}
	}
	if !found {
		http.Error(w, "Project not found", 404)
		return
	}

	projectConfig.Projects = newProjects

	// 削除したプロジェクトがアクティブだった場合、最初のプロジェクトに切り替え
	if projectConfig.ActiveProject == req.ID {
		projectConfig.ActiveProject = projectConfig.Projects[0].ID
	}

	if err := saveProjectConfig(); err != nil {
		http.Error(w, "Failed to save project config: "+err.Error(), 500)
		return
	}

	log.Printf("🗑 Deleted project: %s", req.ID)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
}

// POST /api/agent/set - デフォルトエージェント設定
func handleSetDefaultAgent(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", 405)
		return
	}

	var req struct {
		Agent string `json:"agent"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid JSON", 400)
		return
	}

	// 有効なエージェントか確認
	if _, ok := agents[req.Agent]; !ok {
		http.Error(w, "Unknown agent: "+req.Agent, 400)
		return
	}

	projectConfig.DefaultAgent = req.Agent
	if err := saveProjectConfig(); err != nil {
		http.Error(w, "Failed to save config: "+err.Error(), 500)
		return
	}

	log.Printf("🤖 Default agent set to: %s", req.Agent)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
}

// メタデータからコンテキストを取得（AIプロンプト用）
func getMetadataContext() (tagsContext string, notesContext string) {
	meta, err := loadMetadata()
	if err != nil || meta == nil {
		return "", ""
	}
	
	if len(meta.Tags) > 0 {
		tagsContext = fmt.Sprintf(`
【既存タグ一覧】
以下のタグが既に使われています。可能な限りこの中から選んでください。新しいタグが必要な場合のみ作成してください：
%s
`, strings.Join(meta.Tags, ", "))
	}
	
	if len(meta.Notes) > 0 {
		noteNames := make([]string, len(meta.Notes))
		for i, n := range meta.Notes {
			noteNames[i] = n.Filename
		}
		notesContext = fmt.Sprintf(`
【既存ノート一覧】
以下のノートが既に存在します。関連性があれば、出力のrelated_notesに含めてください：
%s
`, strings.Join(noteNames, "\n"))
	}
	
	return tagsContext, notesContext
}

// AIの応答からJSONを抽出して解析（関連ノート含む）
func parseAIResponseWithRelated(output string) (*AIResponse, []string, error) {
	// より柔軟なJSON抽出
	jsonPattern := regexp.MustCompile(`(?s)\{[^{}]*"title"[^}]*\}`)
	match := jsonPattern.FindString(output)
	if match == "" {
		return nil, nil, fmt.Errorf("no JSON found in response")
	}

	// 関連ノートを含む構造体
	var resp struct {
		Title        string   `json:"title"`
		Slug         string   `json:"slug"`
		Tags         []string `json:"tags"`
		RelatedNotes []string `json:"related_notes"`
	}
	
	if err := json.Unmarshal([]byte(match), &resp); err != nil {
		return nil, nil, err
	}

	// slugが空の場合はtitleから生成
	if resp.Slug == "" {
		resp.Slug = slugify(resp.Title)
	}

	aiResp := &AIResponse{
		Title: resp.Title,
		Slug:  resp.Slug,
		Tags:  resp.Tags,
	}

	return aiResp, resp.RelatedNotes, nil
}

// AIの応答からJSONを抽出して解析
func parseAIResponse(output string) (*AIResponse, error) {
	// JSON部分を抽出 (```json ... ``` や { ... } を探す)
	jsonPattern := regexp.MustCompile(`(?s)\{[^{}]*"title"[^{}]*\}`)
	match := jsonPattern.FindString(output)
	if match == "" {
		return nil, fmt.Errorf("no JSON found in response")
	}

	var resp AIResponse
	if err := json.Unmarshal([]byte(match), &resp); err != nil {
		return nil, err
	}

	// slugが空の場合はtitleから生成
	if resp.Slug == "" {
		resp.Slug = slugify(resp.Title)
	}

	return &resp, nil
}

// 文字列をslug化
func slugify(s string) string {
	s = strings.ToLower(s)
	s = strings.ReplaceAll(s, " ", "-")
	s = strings.ReplaceAll(s, "　", "-")
	// 英数字とハイフン以外を削除
	reg := regexp.MustCompile(`[^a-z0-9\-]`)
	s = reg.ReplaceAllString(s, "")
	// 連続するハイフンを1つに
	reg = regexp.MustCompile(`-+`)
	s = reg.ReplaceAllString(s, "-")
	s = strings.Trim(s, "-")
	if s == "" {
		s = "note"
	}
	return s
}

// --- ユーティリティ: Fleeting Notes走査 ---
func scanFleeting() []Note {
	var notes []Note
	dirFleeting, dirFleetSecret, _, _, _ := getPaths()

	// 01-Fleeting-Notes のルート (Public)
	entries, _ := os.ReadDir(dirFleeting)
	for _, e := range entries {
		if !e.IsDir() && strings.HasSuffix(e.Name(), ".md") && !strings.HasPrefix(e.Name(), ".") {
			notes = append(notes, Note{Path: e.Name(), Filename: e.Name(), IsSecret: false})
		}
	}

	// 01-Fleeting-Notes/Secret の中身 (Private)
	secretEntries, _ := os.ReadDir(dirFleetSecret)
	for _, e := range secretEntries {
		if !e.IsDir() && strings.HasSuffix(e.Name(), ".md") && !strings.HasPrefix(e.Name(), ".") {
			notes = append(notes, Note{Path: filepath.Join("Secret", e.Name()), Filename: "🔒 " + e.Name(), IsSecret: true})
		}
	}
	return notes
}

// --- ユーティリティ: Literature Notes走査 ---
func scanLiterature() []Note {
	var notes []Note
	paths := getAllPaths()
	if paths == nil {
		return notes
	}

	entries, _ := os.ReadDir(paths.Literature)
	for _, e := range entries {
		if !e.IsDir() && strings.HasSuffix(e.Name(), ".md") && !strings.HasPrefix(e.Name(), ".") {
			notes = append(notes, Note{Path: e.Name(), Filename: e.Name(), IsSecret: false})
		}
	}
	return notes
}

// --- ユーティリティ: Permanent Notes走査 ---
func scanPermanent() []Note {
	var notes []Note
	paths := getAllPaths()
	if paths == nil {
		return notes
	}

	// Public
	entries, _ := os.ReadDir(paths.Permanent)
	for _, e := range entries {
		if !e.IsDir() && strings.HasSuffix(e.Name(), ".md") && !strings.HasPrefix(e.Name(), ".") {
			notes = append(notes, Note{Path: e.Name(), Filename: e.Name(), IsSecret: false})
		}
	}

	// Secret
	secretEntries, _ := os.ReadDir(paths.PermanentSecret)
	for _, e := range secretEntries {
		if !e.IsDir() && strings.HasSuffix(e.Name(), ".md") && !strings.HasPrefix(e.Name(), ".") {
			notes = append(notes, Note{Path: filepath.Join("Secret", e.Name()), Filename: "🔒 " + e.Name(), IsSecret: true})
		}
	}
	return notes
}

// --- ユーティリティ: Structured Notes走査 ---
func scanStructured() []Note {
	var notes []Note
	paths := getAllPaths()
	if paths == nil {
		return notes
	}

	entries, _ := os.ReadDir(paths.Structured)
	for _, e := range entries {
		if !e.IsDir() && strings.HasSuffix(e.Name(), ".md") && !strings.HasPrefix(e.Name(), ".") {
			notes = append(notes, Note{Path: e.Name(), Filename: e.Name(), IsSecret: false})
		}
	}
	return notes
}

// --- ハンドラー: Literature Notes API ---
// GET /api/literature - 一覧取得
func handleListLiterature(w http.ResponseWriter, r *http.Request) {
	notes := scanLiterature()
	if notes == nil {
		notes = []Note{}
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(notes)
}

// GET /api/literature/read - ファイル読み取り
func handleReadLiterature(w http.ResponseWriter, r *http.Request) {
	paths := getAllPaths()
	if paths == nil {
		http.Error(w, "No active project", http.StatusBadRequest)
		return
	}

	filename := r.URL.Query().Get("path")
	if filename == "" {
		http.Error(w, "path required", http.StatusBadRequest)
		return
	}

	fullPath := filepath.Join(paths.Literature, filename)
	content, err := os.ReadFile(fullPath)
	if err != nil {
		http.Error(w, "Failed to read file", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"content": string(content)})
}

// POST /api/literature/update - ファイル更新
func handleUpdateLiterature(w http.ResponseWriter, r *http.Request) {
	paths := getAllPaths()
	if paths == nil {
		http.Error(w, "No active project", http.StatusBadRequest)
		return
	}

	var req struct {
		Path    string `json:"path"`
		Content string `json:"content"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	fullPath := filepath.Join(paths.Literature, req.Path)
	if err := os.WriteFile(fullPath, []byte(req.Content), 0644); err != nil {
		http.Error(w, "Failed to write file", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
}

// POST /api/literature/create - 新規作成
func handleCreateLiterature(w http.ResponseWriter, r *http.Request) {
	paths := getAllPaths()
	if paths == nil {
		http.Error(w, "No active project", http.StatusBadRequest)
		return
	}

	var req struct {
		Filename string `json:"filename"`
		Content  string `json:"content"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	if req.Filename == "" {
		http.Error(w, "filename required", http.StatusBadRequest)
		return
	}

	// .mdを追加
	if !strings.HasSuffix(req.Filename, ".md") {
		req.Filename += ".md"
	}

	fullPath := filepath.Join(paths.Literature, req.Filename)
	
	// 既存ファイルチェック
	if _, err := os.Stat(fullPath); err == nil {
		http.Error(w, "File already exists", http.StatusConflict)
		return
	}

	if err := os.WriteFile(fullPath, []byte(req.Content), 0644); err != nil {
		http.Error(w, "Failed to create file", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": "ok", "filename": req.Filename})
}

// POST /api/literature/delete - ファイル削除
func handleDeleteLiterature(w http.ResponseWriter, r *http.Request) {
	paths := getAllPaths()
	if paths == nil {
		http.Error(w, "No active project", http.StatusBadRequest)
		return
	}

	var req struct {
		Path string `json:"path"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	fullPath := filepath.Join(paths.Literature, req.Path)
	if err := os.Remove(fullPath); err != nil {
		http.Error(w, "Failed to delete file", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
}

// --- ハンドラー: Permanent/Structured Notes API (読み取り専用) ---
// GET /api/permanent - 一覧取得
func handleListPermanent(w http.ResponseWriter, r *http.Request) {
	notes := scanPermanent()
	if notes == nil {
		notes = []Note{}
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(notes)
}

// GET /api/permanent/read - ファイル読み取り
func handleReadPermanent(w http.ResponseWriter, r *http.Request) {
	paths := getAllPaths()
	if paths == nil {
		http.Error(w, "No active project", http.StatusBadRequest)
		return
	}

	filename := r.URL.Query().Get("path")
	if filename == "" {
		http.Error(w, "path required", http.StatusBadRequest)
		return
	}

	// Secretの場合
	var fullPath string
	if strings.HasPrefix(filename, "Secret/") {
		fullPath = filepath.Join(paths.PermanentSecret, strings.TrimPrefix(filename, "Secret/"))
	} else {
		fullPath = filepath.Join(paths.Permanent, filename)
	}

	content, err := os.ReadFile(fullPath)
	if err != nil {
		http.Error(w, "Failed to read file", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"content": string(content)})
}

// GET /api/structured - 一覧取得
func handleListStructured(w http.ResponseWriter, r *http.Request) {
	notes := scanStructured()
	if notes == nil {
		notes = []Note{}
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(notes)
}

// GET /api/structured/read - ファイル読み取り
func handleReadStructured(w http.ResponseWriter, r *http.Request) {
	paths := getAllPaths()
	if paths == nil {
		http.Error(w, "No active project", http.StatusBadRequest)
		return
	}

	filename := r.URL.Query().Get("path")
	if filename == "" {
		http.Error(w, "path required", http.StatusBadRequest)
		return
	}

	fullPath := filepath.Join(paths.Structured, filename)
	content, err := os.ReadFile(fullPath)
	if err != nil {
		http.Error(w, "Failed to read file", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"content": string(content)})
}

// --- フロントエンド (HTML/CSS/JS) 埋め込み ---
const htmlTemplate = `
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🌱 Gardener Web</title>
    <style>
        :root {
            /* Deep, rich dark theme */
            --bg-color: #050507;
            --bg-gradient: radial-gradient(circle at 50% 0%, #1a1a2e 0%, #050507 80%);
            
            --card-bg: rgba(255, 255, 255, 0.03);
            --card-border: rgba(255, 255, 255, 0.08);
            --card-hover-border: rgba(255, 255, 255, 0.2);
            
            --text-main: #f0f0f0;
            --text-muted: #8888aa;
            
            /* Neon Accents */
            --accent-primary: #00d26a;    /* Green */
            --accent-secondary: #3b82f6;  /* Blue */
            --accent-danger: #ff4757;     /* Red */
            --accent-warning: #f59e0b;    /* Orange */
            --accent-purple: #b95bf7;     /* Purple */
            
            --glass-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.3);
            
            /* Agent Colors */
            --claude-color: #d97757;
            --gemini-color: #4da6ff;
            --codex-color: #00cf85;
        }

        * { margin: 0; padding: 0; box-sizing: border-box; }

        body {
            background-color: var(--bg-color);
            background-image: var(--bg-gradient);
            color: var(--text-main);
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            min-height: 100vh;
            padding: 40px 20px;
            line-height: 1.6;
        }

        /* Ambient Background Glow */
        body::before {
            content: '';
            position: fixed;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background: 
                radial-gradient(circle at 20% 30%, rgba(59, 130, 246, 0.08) 0%, transparent 40%),
                radial-gradient(circle at 80% 70%, rgba(0, 210, 106, 0.05) 0%, transparent 40%);
            z-index: -1;
            pointer-events: none;
        }

        h1 {
            text-align: center;
            font-size: 3rem;
            font-weight: 800;
            margin-bottom: 0.5rem;
            background: linear-gradient(135deg, #fff 0%, #aaa 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            letter-spacing: -0.05em;
            text-shadow: 0 4px 12px rgba(0,0,0,0.5);
        }

        .subtitle {
            text-align: center;
            color: var(--text-muted);
            margin-bottom: 40px;
            font-size: 1.1rem;
            font-weight: 300;
            letter-spacing: 0.05em;
        }

        /* Navigation / Tabs */
        .tabs {
            display: flex;
            justify-content: center;
            background: rgba(255, 255, 255, 0.05);
            backdrop-filter: blur(10px);
            padding: 6px;
            border-radius: 16px;
            max-width: fit-content;
            margin: 0 auto 40px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.2);
            border: 1px solid var(--card-border);
        }

        .tab-btn {
            background: transparent;
            border: none;
            padding: 10px 24px;
            color: var(--text-muted);
            font-size: 0.95rem;
            font-weight: 600;
            cursor: pointer;
            border-radius: 12px;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .tab-btn:hover {
            color: var(--text-main);
        }

        .tab-btn.active {
            background: rgba(255, 255, 255, 0.1);
            color: #fff;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        }

        /* Agent Selector */
        .agent-selector {
            display: flex;
            justify-content: center;
            gap: 16px;
            margin-bottom: 40px;
        }

        .agent-btn {
            background: var(--card-bg);
            border: 1px solid var(--card-border);
            padding: 12px 24px;
            border-radius: 50px;
            color: var(--text-muted);
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            gap: 8px;
            backdrop-filter: blur(5px);
        }

        .agent-btn:hover {
            border-color: var(--card-hover-border);
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        }

        .agent-btn.active {
            color: #fff;
            border-color: transparent;
        }

        .agent-btn.claude.active { background: linear-gradient(135deg, #d97757 0%, #ff9f7d 100%); box-shadow: 0 0 20px rgba(217, 119, 87, 0.4); }
        .agent-btn.gemini.active { background: linear-gradient(135deg, #4da6ff 0%, #8acaff 100%); box-shadow: 0 0 20px rgba(77, 166, 255, 0.4); }
        .agent-btn.codex.active { background: linear-gradient(135deg, #00cf85 0%, #5effbf 100%); box-shadow: 0 0 20px rgba(0, 207, 133, 0.4); }

        /* Grid & Cards */
        .tab-content { display: none; opacity: 0; transition: opacity 0.3s ease; }
        .tab-content.active { display: block; opacity: 1; animation: fadeIn 0.5s ease; }

        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

        .grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
            gap: 24px;
            max-width: 1400px;
            margin: 0 auto;
        }

        .card {
            background: var(--card-bg);
            border: 1px solid var(--card-border);
            border-radius: 20px;
            padding: 24px;
            backdrop-filter: blur(12px);
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            position: relative;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0,0,0,0.05);
        }

        .card::before {
            content: '';
            position: absolute;
            top: 0; left: 0; right: 0; height: 1px;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
        }

        .card:hover {
            transform: translateY(-6px) scale(1.02);
            border-color: var(--card-hover-border);
            box-shadow: var(--glass-shadow);
        }

        /* Private/Secret Indicator */
        .card.secret-warning {
            border-color: rgba(185, 91, 247, 0.4);
            box-shadow: 0 0 15px rgba(185, 91, 247, 0.1);
        }
        .card.secret-warning .filename {
            color: #dcb0ff;
        }

        .filename {
            font-size: 1.2rem;
            font-weight: 700;
            margin-bottom: 20px;
            line-height: 1.4;
            color: var(--text-main);
            word-break: break-all;
            cursor: pointer;
            transition: color 0.2s;
        }
        .filename:hover {
            color: var(--accent-secondary);
        }

        .actions {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 12px;
            margin-top: auto;
        }

        button {
            border: none;
            padding: 10px 16px;
            border-radius: 12px;
            font-weight: 700;
            font-size: 0.85rem;
            cursor: pointer;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            text-shadow: 0 1px 2px rgba(0,0,0,0.2);
        }

        button:active { transform: scale(0.95); }

        .btn-edit { 
            background: rgba(255,255,255,0.05); 
            color: var(--text-main); 
            border: 1px solid var(--card-border);
        }
        .btn-edit:hover { background: rgba(255,255,255,0.1); border-color: rgba(255,255,255,0.2); }

        .btn-public { 
            background: linear-gradient(135deg, #059669 0%, #10b981 100%); 
            color: white; 
            box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
        }
        .btn-public:hover { filter: brightness(1.1); box-shadow: 0 6px 16px rgba(16, 185, 129, 0.4); }

        .btn-private { 
            background: linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%); 
            color: white;
            box-shadow: 0 4px 12px rgba(124, 58, 237, 0.3);
        }
        .btn-private:hover { filter: brightness(1.1); box-shadow: 0 6px 16px rgba(124, 58, 237, 0.4); }

        /* Empty State */
        .empty-state {
            grid-column: 1/-1;
            text-align: center;
            padding: 80px 20px;
            color: var(--text-muted);
            background: rgba(255,255,255,0.02);
            border-radius: 20px;
            border: 2px dashed var(--card-border);
        }
        .empty-state .icon { font-size: 4rem; margin-bottom: 20px; opacity: 0.8; }
        
        /* Forms */
        .create-form {
            max-width: 800px;
            margin: 0 auto;
            background: var(--card-bg);
            border: 1px solid var(--card-border);
            border-radius: 24px;
            padding: 40px;
            backdrop-filter: blur(20px);
            box-shadow: var(--glass-shadow);
        }

        .create-form h2 {
            margin: 0 0 24px;
            font-size: 1.5rem;
            color: var(--text-main);
            display: flex;
            align-items: center;
            gap: 12px;
        }

        textarea {
            width: 100%;
            min-height: 400px;
            background: rgba(0,0,0,0.3);
            border: 1px solid var(--card-border);
            border-radius: 16px;
            padding: 20px;
            color: var(--text-main);
            font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
            font-size: 1rem;
            line-height: 1.6;
            resize: vertical;
            transition: border-color 0.3s ease;
        }
        textarea:focus {
            outline: none;
            border-color: var(--accent-secondary);
            background: rgba(0,0,0,0.4);
        }

        /* Toggle Switch */
        .toggle-container {
            display: flex;
            align-items: center;
            gap: 16px;
            margin: 24px 0;
            padding: 16px;
            background: rgba(0,0,0,0.2);
            border-radius: 12px;
            width: fit-content;
        }

        .toggle {
            position: relative;
            display: inline-block;
            width: 52px;
            height: 28px;
        }
        .toggle input { opacity: 0; width: 0; height: 0; }
        .slider {
            position: absolute;
            cursor: pointer;
            top: 0; left: 0; right: 0; bottom: 0;
            background-color: #333;
            transition: .4s;
            border-radius: 34px;
        }
        .slider:before {
            position: absolute;
            content: "";
            height: 20px;
            width: 20px;
            left: 4px;
            bottom: 4px;
            background-color: white;
            transition: .4s;
            border-radius: 50%;
        }
        input:checked + .slider { background-color: var(--accent-purple); }
        input:checked + .slider:before { transform: translateX(24px); }
        .toggle-label { font-weight: 600; color: var(--text-main); }

        .form-actions {
            display: flex;
            justify-content: flex-end;
            gap: 16px;
            margin-top: 32px;
        }

        /* Collapsible Create Section */
        .create-section {
            max-width: 800px;
            margin: 0 auto 40px;
            background: var(--card-bg);
            border: 1px solid var(--card-border);
            border-radius: 20px;
            overflow: hidden;
            backdrop-filter: blur(20px);
            box-shadow: var(--glass-shadow);
        }
        
        .create-header {
            padding: 20px 24px;
            background: rgba(255,255,255,0.02);
            cursor: pointer;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-weight: 600;
            color: var(--text-main);
            transition: background 0.2s;
        }
        
        .create-header:hover {
            background: rgba(255,255,255,0.05);
        }
        
        .create-form-container {
            display: none;
            padding: 24px;
            border-top: 1px solid var(--card-border);
            animation: slideDown 0.3s ease;
        }
        
        .create-form-container.active {
            display: block;
        }
        
        .create-form-container textarea {
            min-height: 200px;
        }
        
        @keyframes slideDown {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
        }

        /* Modals */
        .modal {
            display: none;
            position: fixed;
            z-index: 1000;
            left: 0; top: 0;
            width: 100%; height: 100%;
            background-color: rgba(0,0,0,0.6);
            backdrop-filter: blur(8px);
            opacity: 0;
            transition: opacity 0.3s ease;
        }

        .modal.active {
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 1;
        }

        .modal-content {
            background: #121216;
            border: 1px solid var(--card-border);
            width: 90%;
            max-width: 900px;
            border-radius: 24px;
            padding: 32px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.5);
            transform: scale(0.95);
            transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
            display: flex;
            flex-direction: column;
            max-height: 90vh;
        }

        .modal.active .modal-content {
            transform: scale(1);
        }

        .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 24px;
            padding-bottom: 20px;
            border-bottom: 1px solid var(--card-border);
        }

        .modal-header h2 { margin: 0; font-size: 1.4rem; color: var(--text-main); }
        
        .modal-close {
            background: transparent;
            color: var(--text-muted);
            font-size: 2rem;
            line-height: 1;
            padding: 0;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s;
        }
        .modal-close:hover {
            background: rgba(255,255,255,0.1);
            color: #fff;
        }

        .modal-body { flex: 1; overflow: hidden; display: flex; flex-direction: column; }
        .modal-body textarea { flex: 1; min-height: 50vh; }

        .modal-footer {
            margin-top: 24px;
            padding-top: 20px;
            border-top: 1px solid var(--card-border);
            display: flex;
            justify-content: flex-end;
            gap: 12px;
        }

        /* Settings Panel */
        .settings-panel {
            background: rgba(0,0,0,0.2);
            border-radius: 16px;
            padding: 24px;
            margin-bottom: 24px;
            border: 1px solid var(--card-border);
        }
        .settings-header {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 16px;
            color: var(--text-muted);
            text-transform: uppercase;
            font-size: 0.8rem;
            letter-spacing: 0.1em;
            font-weight: 700;
        }

        /* Status Colors */
        .status-ok { color: var(--accent-primary); }
        .status-warn { color: var(--accent-warning); }

        /* Project Selector */
        .project-selector {
            display: flex;
            justify-content: center;
            margin-bottom: 20px;
        }
        .project-select {
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid var(--card-border);
            color: var(--text-main);
            padding: 10px 40px 10px 16px;
            border-radius: 12px;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            appearance: none;
            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='%23888' viewBox='0 0 24 24'%3E%3Cpath d='M7 10l5 5 5-5z'/%3E%3C/svg%3E");
            background-repeat: no-repeat;
            background-position: right 12px center;
            background-size: 20px;
            transition: all 0.3s ease;
        }
        .project-select:hover {
            border-color: var(--card-hover-border);
            background-color: rgba(255, 255, 255, 0.08);
        }
        .project-select:focus {
            outline: none;
            border-color: var(--accent-secondary);
        }
        .project-select option {
            background: #1a1a2e;
            color: var(--text-main);
        }

        /* Project Form in Settings */
        .project-form {
            display: flex;
            gap: 12px;
            flex-wrap: wrap;
            margin-top: 16px;
        }
        .project-form input {
            flex: 1;
            min-width: 200px;
            background: rgba(0,0,0,0.3);
            border: 1px solid var(--card-border);
            border-radius: 8px;
            padding: 10px 16px;
            color: var(--text-main);
            font-size: 0.9rem;
        }
        .project-form input:focus {
            outline: none;
            border-color: var(--accent-secondary);
        }
        .project-form input::placeholder {
            color: var(--text-muted);
        }
        .project-list {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }
        .project-item {
            display: flex;
            align-items: center;
            justify-content: space-between;
            background: rgba(0,0,0,0.2);
            padding: 12px 16px;
            border-radius: 8px;
            border: 1px solid var(--card-border);
        }
        .project-item.active {
            border-color: var(--accent-primary);
            background: rgba(0, 210, 106, 0.1);
        }
        .project-item-name {
            font-weight: 600;
        }
        .project-item-path {
            font-size: 0.8rem;
            color: var(--text-muted);
            font-family: monospace;
        }
        .project-item-delete {
            background: transparent;
            border: 1px solid var(--accent-danger);
            color: var(--accent-danger);
            padding: 4px 12px;
            border-radius: 6px;
            font-size: 0.8rem;
            cursor: pointer;
            transition: all 0.2s;
        }
        .project-item-delete:hover {
            background: var(--accent-danger);
            color: white;
        }

    </style>
</head>
<body>

    <h1>🌱 Gardener Web</h1>
    <p class="subtitle">AI-Powered Knowledge Management System</p>

    <div class="project-selector">
        <select id="project-select" class="project-select" onchange="switchProject()">
            <!-- Populated by JavaScript -->
        </select>
    </div>

    <div class="tabs">
        <button class="tab-btn active" onclick="showTab('inbox')">📥 Inbox</button>
        <button class="tab-btn" onclick="showTab('literature')">📖 Literature</button>
        <button class="tab-btn" onclick="showTab('permanent')">📌 Permanent</button>
        <button class="tab-btn" onclick="showTab('structured')">📋 Structured</button>
        <button class="tab-btn" onclick="showTab('settings')">⚙️ Settings</button>
    </div>
    
    <div class="agent-selector">
        <button class="agent-btn claude active" onclick="selectAgent('claude')"><span>🟠</span> Claude</button>
        <button class="agent-btn gemini" onclick="selectAgent('gemini')"><span>🔵</span> Gemini</button>
        <button class="agent-btn codex" onclick="selectAgent('codex')"><span>🟢</span> Codex</button>
    </div>

    <!-- Inbox Tab (with Create Note) -->
    <div id="tab-inbox" class="tab-content active">
        <!-- Create Note Section -->
        <div class="create-section">
            <div class="create-header" onclick="toggleCreateForm()">
                <span>📝 Create New Fleeting Note</span>
                <span id="create-toggle-icon">▼</span>
            </div>
            <div id="create-form-container" class="create-form-container">
                <textarea id="note-content" placeholder="# Title

Enter your thought here...

- Supports Markdown
- AI will auto-tag and categorize"></textarea>
                
                <div class="toggle-container">
                    <div class="toggle">
                        <input type="checkbox" id="is-secret">
                        <span class="slider"></span>
                    </div>
                    <span class="toggle-label">🔒 Save as Private (Secret)</span>
                </div>

                <div class="form-actions">
                    <button class="btn-edit" onclick="clearForm()">🗑 Clear</button>
                    <button class="btn-public" onclick="createNote()" id="create-btn" style="padding: 12px 40px;">✨ Create Note</button>
                </div>
            </div>
        </div>
        
        <!-- Inbox Notes Grid -->
        <div class="grid">
            {{range .}}
            <div class="card {{if .IsSecret}}secret-warning{{end}}" id="card-{{.Path}}">
                <div class="filename" onclick="openEditor('{{.Path}}')">{{.Filename}}</div>
                <div class="actions">
                    <button class="btn-edit" onclick="openEditor('{{.Path}}')">✏️ Edit</button>
                    <button class="btn-public" onclick="runAgent('{{.Path}}', 'public')">🌐 Perm</button>
                    <button class="btn-private" onclick="runAgent('{{.Path}}', 'private')">🔒 Secret</button>
                </div>
            </div>
            {{else}}
            <div class="empty-state">
                <div class="icon">🕸️</div>
                <h3>Your Inbox is Empty</h3>
                <p>Great job! All fleeting notes have been processed.</p>
                <div style="margin-top: 16px;">
                    <button class="btn-public" onclick="toggleCreateForm()" style="display:inline-flex;">Create New Note</button>
                </div>
            </div>
            {{end}}
        </div>
        
        <div style="text-align: center; margin-top: 60px; padding-bottom: 40px;">
             <button class="btn-edit" onclick="location.reload()" style="background:transparent; border:1px solid var(--card-border); padding: 12px 32px;">
                🔄 Refresh Inbox
             </button>
        </div>
    </div>

    <!-- Literature Tab -->
    <div id="tab-literature" class="tab-content">
        <!-- Create Literature Note Section -->
        <div class="create-section">
            <div class="create-header" onclick="toggleLiteratureForm()">
                <span>📖 Create New Literature Note</span>
                <span id="literature-toggle-icon">▼</span>
            </div>
            <div id="literature-form-container" class="create-form-container">
                <input type="text" id="literature-filename" placeholder="Filename (without .md)" style="width: 100%; margin-bottom: 16px; padding: 12px 16px; background: rgba(0,0,0,0.3); border: 1px solid var(--card-border); border-radius: 12px; color: var(--text-main); font-size: 1rem;">
                <textarea id="literature-content" placeholder="# Document Title

## Summary

## Key Points

## Notes"></textarea>
                
                <div class="form-actions">
                    <button class="btn-edit" onclick="clearLiteratureForm()">🗑 Clear</button>
                    <button class="btn-public" onclick="createLiteratureNote()" id="create-lit-btn" style="padding: 12px 40px;">📖 Create</button>
                </div>
            </div>
        </div>
        
        <div id="literature-grid" class="grid">
            <div class="empty-state">
                <div class="icon">📚</div>
                <h3>Loading...</h3>
            </div>
        </div>
        
        <div style="text-align: center; margin-top: 60px; padding-bottom: 40px;">
             <button class="btn-edit" onclick="loadLiteratureNotes()" style="background:transparent; border:1px solid var(--card-border); padding: 12px 32px;">
                🔄 Refresh Literature
             </button>
        </div>
    </div>

    <!-- Permanent Tab (Read-only) -->
    <div id="tab-permanent" class="tab-content">
        <div id="permanent-grid" class="grid">
            <div class="empty-state">
                <div class="icon">📌</div>
                <h3>Loading...</h3>
            </div>
        </div>
        
        <div style="text-align: center; margin-top: 60px; padding-bottom: 40px;">
             <button class="btn-edit" onclick="loadPermanentNotes()" style="background:transparent; border:1px solid var(--card-border); padding: 12px 32px;">
                🔄 Refresh Permanent
             </button>
        </div>
    </div>

    <!-- Structured Tab (Read-only) -->
    <div id="tab-structured" class="tab-content">
        <div id="structured-grid" class="grid">
            <div class="empty-state">
                <div class="icon">📋</div>
                <h3>Loading...</h3>
            </div>
        </div>
        
        <div style="text-align: center; margin-top: 60px; padding-bottom: 40px;">
             <button class="btn-edit" onclick="loadStructuredNotes()" style="background:transparent; border:1px solid var(--card-border); padding: 12px 32px;">
                🔄 Refresh Structured
             </button>
        </div>
    </div>

    <!-- Settings Tab -->
    <div id="tab-settings" class="tab-content">
        <div class="create-form">
            <h2>⚙️ System Settings</h2>
            
            <div class="settings-panel">
                <div class="settings-header">� Projects</div>
                <div id="project-list" class="project-list">
                    <span style="opacity:0.5">Loading projects...</span>
                </div>
                <div class="project-form">
                    <input type="text" id="new-project-name" placeholder="Project Name">
                    <input type="text" id="new-project-path" placeholder="/path/to/memory/root">
                    <button class="btn-public" onclick="createProject()">➕ Add</button>
                </div>
            </div>

            <div class="settings-panel">
                <div class="settings-header">�📊 Metadata Status</div>
                <div id="metadata-stats" style="font-family: monospace; line-height: 1.8;">
                    <span style="opacity:0.5">querying database...</span>
                </div>
            </div>

            <div class="settings-panel">
                <div class="settings-header">🔧 Maintenance</div>
                <div style="display: flex; gap: 16px; flex-wrap: wrap;">
                    <button class="btn-public" onclick="syncMetadata()" id="sync-btn">🔄 Rebuild Metadata Index</button>
                    <button class="btn-edit" onclick="loadMetadataStats()">📊 Refresh Stats</button>
                </div>
                <p style="margin-top: 16px; font-size: 0.85rem; color: var(--text-muted);">
                    "Rebuild Metadata Index" scans all Permanent Notes and regenerates the JSON database.
                </p>
            </div>

            <div class="settings-panel">
                <div class="settings-header">📁 File System Paths</div>
                <div id="paths-display" style="font-family: monospace; font-size: 0.85rem; background: rgba(0,0,0,0.3); padding: 16px; border-radius: 8px;">
                    <div><span style="color:var(--accent-primary)">Fleeting:</span>  01-Fleeting-Notes/</div>
                    <div><span style="color:var(--accent-secondary)">Permanent:</span> 02-Permanent-Notes/</div>
                    <div><span style="color:var(--accent-warning)">Metadata:</span>  91_Metadata/metadata.json</div>
                </div>
            </div>
        </div>
    </div>

    <!-- Inbox Edit Modal -->
    <div id="inbox-modal" class="modal">
        <div class="modal-content">
            <div class="modal-header" style="border-bottom-color: var(--accent-primary);">
                <h2 id="inbox-modal-title">📥 Edit Fleeting Note</h2>
                <button class="modal-close" onclick="closeInboxModal()">&times;</button>
            </div>
            <div class="modal-body">
                <textarea id="inbox-modal-content"></textarea>
            </div>
            <div class="modal-footer">
                <button class="btn-edit" onclick="deleteInboxNote()" style="color: var(--accent-danger); border-color: var(--accent-danger); margin-right: auto;">🗑 Delete</button>
                <button class="btn-edit" onclick="saveInboxNote()">💾 Save Draft</button>
                <button class="btn-public" onclick="saveAndProcessInbox('public')">🌐 Process Public</button>
                <button class="btn-private" onclick="saveAndProcessInbox('private')">🔒 Process Secret</button>
            </div>
        </div>
    </div>

    <!-- Literature Edit Modal -->
    <div id="literature-modal" class="modal">
        <div class="modal-content">
            <div class="modal-header" style="border-bottom-color: #60a5fa;">
                <h2 id="literature-modal-title">📖 Edit Literature Note</h2>
                <button class="modal-close" onclick="closeLiteratureModal()">&times;</button>
            </div>
            <div class="modal-body">
                <textarea id="literature-modal-content"></textarea>
            </div>
            <div class="modal-footer">
                <button class="btn-edit" onclick="deleteLiteratureFromModal()" style="color: var(--accent-danger); border-color: var(--accent-danger); margin-right: auto;">🗑 Delete</button>
                <button class="btn-public" onclick="saveLiteratureNote()" style="background: linear-gradient(135deg, #3b82f6, #60a5fa);">💾 Save Changes</button>
            </div>
        </div>
    </div>

    <!-- Permanent View Modal (Read-only) -->
    <div id="permanent-modal" class="modal">
        <div class="modal-content">
            <div class="modal-header" style="border-bottom-color: var(--accent-warning);">
                <h2 id="permanent-modal-title">📌 Permanent Note</h2>
                <button class="modal-close" onclick="closePermanentModal()">&times;</button>
            </div>
            <div class="modal-body">
                <div class="readonly-notice" style="background: rgba(255,179,71,0.1); border: 1px solid rgba(255,179,71,0.3); border-radius: 12px; padding: 12px 16px; margin-bottom: 16px; color: var(--accent-warning); font-size: 0.9rem;">
                    🔒 This is a processed permanent note. View only.
                </div>
                <textarea id="permanent-modal-content" readonly style="background: rgba(0,0,0,0.2); opacity: 0.9;"></textarea>
            </div>
            <div class="modal-footer">
                <span style="color: var(--text-muted); font-size: 0.85rem;">Permanent notes are read-only</span>
                <button class="btn-edit" onclick="closePermanentModal()">✓ Close</button>
            </div>
        </div>
    </div>

    <!-- Structured View Modal (Read-only) -->
    <div id="structured-modal" class="modal">
        <div class="modal-content">
            <div class="modal-header" style="border-bottom-color: #a78bfa;">
                <h2 id="structured-modal-title">📋 Structured Note</h2>
                <button class="modal-close" onclick="closeStructuredModal()">&times;</button>
            </div>
            <div class="modal-body">
                <div class="readonly-notice" style="background: rgba(167,139,250,0.1); border: 1px solid rgba(167,139,250,0.3); border-radius: 12px; padding: 12px 16px; margin-bottom: 16px; color: #a78bfa; font-size: 0.9rem;">
                    📋 This is a structured reference note. View only.
                </div>
                <textarea id="structured-modal-content" readonly style="background: rgba(0,0,0,0.2); opacity: 0.9;"></textarea>
            </div>
            <div class="modal-footer">
                <span style="color: var(--text-muted); font-size: 0.85rem;">Structured notes are read-only</span>
                <button class="btn-edit" onclick="closeStructuredModal()">✓ Close</button>
            </div>
        </div>
    </div>

    <script>
        // State
        let currentAgent = 'claude';
        let currentEditPath = '';
        let currentEditType = 'inbox'; // 'inbox', 'literature', 'view'

        // UI Helpers
        function showTab(tabName) {
            document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
            
            // Update active tab button
            const btns = document.querySelectorAll('.tab-btn');
            const tabIndex = { 'inbox': 0, 'literature': 1, 'permanent': 2, 'structured': 3, 'settings': 4 };
            if (tabIndex[tabName] !== undefined) {
                btns[tabIndex[tabName]].classList.add('active');
            }

            document.getElementById('tab-' + tabName).classList.add('active');
            
            // Load data when switching tabs
            if (tabName === 'literature') loadLiteratureNotes();
            if (tabName === 'permanent') loadPermanentNotes();
            if (tabName === 'structured') loadStructuredNotes();
        }

        function selectAgent(agent) {
            currentAgent = agent;
            document.querySelectorAll('.agent-btn').forEach(btn => btn.classList.remove('active'));
            document.querySelector('.agent-btn.' + agent).classList.add('active');
            
            // デフォルトとして保存
            fetch('/api/agent/set', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ agent })
            });
        }

        function clearForm() {
            document.getElementById('note-content').value = '';
            document.getElementById('is-secret').checked = false;
        }

        // --- Inbox Modal Logic ---
        let currentInboxPath = '';

        async function openEditor(path) {
            try {
                document.body.style.cursor = 'wait';
                const res = await fetch('/api/inbox/read?path=' + encodeURIComponent(path));
                if (!res.ok) throw new Error('Failed to load file');
                
                const data = await res.json();
                currentInboxPath = path;
                document.getElementById('inbox-modal-title').innerText = '📥 ' + path;
                document.getElementById('inbox-modal-content').value = data.content;
                document.getElementById('inbox-modal').classList.add('active');
            } catch (e) {
                alert('Error: ' + e.message);
            } finally {
                document.body.style.cursor = 'default';
            }
        }

        function closeInboxModal() {
            document.getElementById('inbox-modal').classList.remove('active');
            currentInboxPath = '';
        }

        async function saveInboxNote() {
            const content = document.getElementById('inbox-modal-content').value;
            try {
                const res = await fetch('/api/inbox/update', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ path: currentInboxPath, content: content })
                });
                
                const btn = document.querySelector('#inbox-modal .btn-edit:nth-child(2)');
                const originalText = btn.innerText;
                if (res.ok) {
                    btn.innerText = '✅ Saved';
                    setTimeout(() => btn.innerText = originalText, 1500);
                } else {
                    alert('Failed to save');
                }
            } catch (e) {
                alert('Network error');
            }
        }

        async function saveAndProcessInbox(target) {
            const pathToProcess = currentInboxPath;
            await saveInboxNote();
            closeInboxModal();
            await runAgent(pathToProcess, target);
        }

        async function deleteInboxNote() {
            if (!confirm('Are you sure you want to PERMANENTLY delete this note?')) return;
            try {
                const res = await fetch('/api/inbox/delete', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ path: currentInboxPath })
                });
                if (res.ok) {
                    closeInboxModal();
                    const card = document.getElementById('card-' + currentInboxPath);
                    if (card) {
                        card.style.transform = 'scale(0.9) opacity(0)';
                        setTimeout(() => card.remove(), 300);
                    }
                } else {
                    alert('Failed to delete');
                }
            } catch (e) {
                alert('Network error');
            }
        }

        // --- Create Logic ---
        async function createNote() {
            const content = document.getElementById('note-content').value.trim();
            const isSecret = document.getElementById('is-secret').checked;
            const btn = document.getElementById('create-btn');

            if (!content) {
                alert('Please enter some content');
                return;
            }

            btn.disabled = true;
            btn.innerHTML = '🤖 Creating...';

            try {
                const res = await fetch('/create', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ content, isSecret, agent: currentAgent })
                });

                if (res.ok) {
                    const data = await res.json();
                    
                    // Success feedback
                    btn.innerHTML = '✅ Created!';
                    setTimeout(() => {
                        btn.innerHTML = '✨ Create Note';
                        btn.disabled = false;
                        clearForm();
                        showTab('inbox'); // Go to inbox to see it
                        location.reload(); // Reload to fetch new list
                    }, 1000);
                } else {
                    const txt = await res.text();
                    alert('❌ Error: ' + txt);
                    btn.disabled = false;
                    btn.innerHTML = '✨ Create Note';
                }
            } catch (e) {
                alert('❌ Network Error');
                btn.disabled = false;
                btn.innerHTML = '✨ Create Note';
            }
        }

        // --- Agent Processing Logic ---
        async function runAgent(path, target) {
            if (path.startsWith("Secret") && target === 'public') {
                if (!confirm("⚠️ Warning: You are moving a SECRET file to PUBLIC.\nAre you sure?")) return;
            }

            const card = document.getElementById('card-' + path);
            if(!card) return;
            
            const btns = card.querySelectorAll('button');
            btns.forEach(b => b.disabled = true);
            
            // Visual feedback
            card.style.transition = 'all 0.3s';
            card.style.filter = 'grayscale(100%) opacity(0.7)';
            
            // Show processing badge
            const statusDiv = document.createElement('div');
            statusDiv.className = 'processing-status';
            statusDiv.innerText = '🤖 ' + currentAgent.toUpperCase() + ' working...';
            statusDiv.style.position = 'absolute';
            statusDiv.style.top = '50%';
            statusDiv.style.left = '50%';
            statusDiv.style.transform = 'translate(-50%, -50%)';
            statusDiv.style.background = 'rgba(0,0,0,0.8)';
            statusDiv.style.padding = '8px 16px';
            statusDiv.style.borderRadius = '8px';
            statusDiv.style.color = '#fff';
            statusDiv.style.fontWeight = 'bold';
            card.appendChild(statusDiv);

            try {
                const res = await fetch('/process', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ path, target, agent: currentAgent })
                });

                if (res.ok) {
                    card.style.transform = "scale(0.8) translateY(-20px)";
                    card.style.opacity = "0";
                    setTimeout(() => card.remove(), 500);
                } else {
                    const txt = await res.text();
                    alert("❌ Error: " + txt);
                    // Reset
                    btns.forEach(b => b.disabled = false);
                    card.style.filter = 'none';
                    statusDiv.remove();
                }
            } catch (e) {
                alert("❌ Network Error");
                btns.forEach(b => b.disabled = false);
                card.style.filter = 'none';
                statusDiv.remove();
            }
        }

        // --- Metadata Logic ---
        async function syncMetadata() {
            const btn = document.getElementById('sync-btn');
            btn.disabled = true;
            btn.innerText = '🔄 Rebuilding...';

            try {
                const res = await fetch('/api/metadata/sync', { method: 'POST' });
                const data = await res.json();
                
                if (res.ok) {
                    loadMetadataStats();
                } else {
                    alert('❌ Error: ' + JSON.stringify(data));
                }
            } catch (e) {
                alert('❌ Network Error');
            } finally {
                btn.disabled = false;
                btn.innerText = '🔄 Rebuild Metadata Index';
            }
        }

        async function loadMetadataStats() {
            const container = document.getElementById('metadata-stats');
            container.style.opacity = '0.5';
            
            try {
                const res = await fetch('/api/metadata');
                const data = await res.json();
                
                container.innerHTML = 
                    '<div><strong>Indexed Notes:</strong> <span class="status-ok">' + data.notes.length + '</span></div>' +
                    '<div><strong>Total Tags:</strong> <span class="status-ok">' + data.tags.length + '</span></div>' +
                    '<div style="margin-top:8px; font-size:0.8em; color:var(--text-muted)">Last Updated: ' + (data.lastUpdated || 'Never') + '</div>';
                
                container.style.opacity = '1';
            } catch (e) {
                container.innerHTML = '<div style="color: var(--accent-danger);">Failed to load metadata</div>';
            }
        }

        // --- Project Management ---
        let projectsData = null;

        async function loadProjects() {
            try {
                const res = await fetch('/api/projects');
                projectsData = await res.json();
                renderProjectSelector();
                renderProjectList();
                
                // デフォルトエージェントを復元
                if (projectsData.defaultAgent && projectsData.defaultAgent !== currentAgent) {
                    currentAgent = projectsData.defaultAgent;
                    document.querySelectorAll('.agent-btn').forEach(btn => btn.classList.remove('active'));
                    const agentBtn = document.querySelector('.agent-btn.' + currentAgent);
                    if (agentBtn) agentBtn.classList.add('active');
                }
            } catch (e) {
                console.error('Failed to load projects:', e);
            }
        }

        function renderProjectSelector() {
            const select = document.getElementById('project-select');
            if (!projectsData || !select) return;
            
            select.innerHTML = projectsData.projects.map(p => 
                '<option value="' + p.id + '"' + (p.id === projectsData.activeProject ? ' selected' : '') + '>' + 
                '📂 ' + p.name + '</option>'
            ).join('');
        }

        function renderProjectList() {
            const container = document.getElementById('project-list');
            if (!projectsData || !container) return;
            
            if (projectsData.projects.length === 0) {
                container.innerHTML = '<span style="opacity:0.5">No projects configured</span>';
                return;
            }

            container.innerHTML = projectsData.projects.map(p => 
                '<div class="project-item' + (p.id === projectsData.activeProject ? ' active' : '') + '">' +
                    '<div style="flex:1">' +
                        '<div class="project-item-name">' + p.name + (p.id === projectsData.activeProject ? ' ✓' : '') + '</div>' +
                        '<div class="project-item-path">' + p.rootPath + '</div>' +
                    '</div>' +
                    (projectsData.projects.length > 1 ? 
                        '<button class="project-item-delete" onclick="deleteProject(\'' + p.id + '\')">Delete</button>' : '') +
                '</div>'
            ).join('');
        }

        async function switchProject() {
            const select = document.getElementById('project-select');
            const id = select.value;
            
            try {
                const res = await fetch('/api/projects/switch', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id })
                });
                
                if (res.ok) {
                    // Reload page to show new project's notes
                    location.reload();
                } else {
                    alert('Failed to switch project');
                }
            } catch (e) {
                alert('Network error');
            }
        }

        async function createProject() {
            const name = document.getElementById('new-project-name').value.trim();
            const rootPath = document.getElementById('new-project-path').value.trim();
            
            if (!name || !rootPath) {
                alert('Please enter both project name and root path');
                return;
            }
            
            try {
                const res = await fetch('/api/projects/create', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, rootPath })
                });
                
                if (res.ok) {
                    document.getElementById('new-project-name').value = '';
                    document.getElementById('new-project-path').value = '';
                    await loadProjects();
                } else {
                    const text = await res.text();
                    alert('Failed to create project: ' + text);
                }
            } catch (e) {
                alert('Network error');
            }
        }

        async function deleteProject(id) {
            if (!confirm('Are you sure you want to delete this project?')) return;
            
            try {
                const res = await fetch('/api/projects/delete', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id })
                });
                
                if (res.ok) {
                    await loadProjects();
                    // If active project was deleted, page will need reload
                    if (projectsData.activeProject !== id) {
                        await loadProjects();
                    } else {
                        location.reload();
                    }
                } else {
                    const text = await res.text();
                    alert('Failed to delete project: ' + text);
                }
            } catch (e) {
                alert('Network error');
            }
        }

        // --- Create Form Toggle ---
        function toggleCreateForm() {
            const container = document.getElementById('create-form-container');
            const icon = document.getElementById('create-toggle-icon');
            container.classList.toggle('active');
            icon.innerText = container.classList.contains('active') ? '▲' : '▼';
        }
        
        function toggleLiteratureForm() {
            const container = document.getElementById('literature-form-container');
            const icon = document.getElementById('literature-toggle-icon');
            container.classList.toggle('active');
            icon.innerText = container.classList.contains('active') ? '▲' : '▼';
        }

        // --- Literature Notes Functions ---
        let currentLiteraturePath = '';
        
        async function loadLiteratureNotes() {
            const container = document.getElementById('literature-grid');
            container.innerHTML = '<div class="empty-state"><div class="icon">⏳</div><h3>Loading...</h3></div>';
            
            try {
                const res = await fetch('/api/literature');
                const notes = await res.json();
                
                if (notes.length === 0) {
                    container.innerHTML = '<div class="empty-state"><div class="icon">📚</div><h3>No Literature Notes</h3><p>Create your first literature note above.</p></div>';
                    return;
                }
                
                container.innerHTML = notes.map(note => 
                    '<div class="card" id="lit-card-' + note.Path + '">' +
                        '<div class="filename" onclick="openLiteratureEditor(\'' + note.Path + '\')">' + note.Filename + '</div>' +
                        '<div class="actions">' +
                            '<button class="btn-edit" onclick="openLiteratureEditor(\'' + note.Path + '\')">✏️ Edit</button>' +
                            '<button class="btn-private" onclick="deleteLiteratureNote(\'' + note.Path + '\')">🗑️</button>' +
                        '</div>' +
                    '</div>'
                ).join('');
            } catch (e) {
                container.innerHTML = '<div class="empty-state"><div class="icon">❌</div><h3>Failed to load</h3></div>';
            }
        }
        
        function clearLiteratureForm() {
            document.getElementById('literature-filename').value = '';
            document.getElementById('literature-content').value = '';
        }
        
        async function createLiteratureNote() {
            const filename = document.getElementById('literature-filename').value.trim();
            const content = document.getElementById('literature-content').value;
            const btn = document.getElementById('create-lit-btn');
            
            if (!filename) {
                alert('Please enter a filename');
                return;
            }
            
            btn.disabled = true;
            btn.innerHTML = '⏳ Creating...';
            
            try {
                const res = await fetch('/api/literature/create', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ filename, content })
                });
                
                if (res.ok) {
                    btn.innerHTML = '✅ Created!';
                    clearLiteratureForm();
                    toggleLiteratureForm();
                    setTimeout(() => {
                        btn.innerHTML = '📖 Create';
                        btn.disabled = false;
                        loadLiteratureNotes();
                    }, 1000);
                } else {
                    const text = await res.text();
                    alert('Error: ' + text);
                    btn.disabled = false;
                    btn.innerHTML = '📖 Create';
                }
            } catch (e) {
                alert('Network error');
                btn.disabled = false;
                btn.innerHTML = '📖 Create';
            }
        }
        
        async function openLiteratureEditor(path) {
            try {
                document.body.style.cursor = 'wait';
                const res = await fetch('/api/literature/read?path=' + encodeURIComponent(path));
                if (!res.ok) throw new Error('Failed to load file');
                
                const data = await res.json();
                currentLiteraturePath = path;
                document.getElementById('literature-modal-title').innerText = '📖 ' + path;
                document.getElementById('literature-modal-content').value = data.content;
                document.getElementById('literature-modal').classList.add('active');
            } catch (e) {
                alert('Error: ' + e.message);
            } finally {
                document.body.style.cursor = 'default';
            }
        }

        function closeLiteratureModal() {
            document.getElementById('literature-modal').classList.remove('active');
            currentLiteraturePath = '';
        }

        async function saveLiteratureNote() {
            const content = document.getElementById('literature-modal-content').value;
            try {
                const res = await fetch('/api/literature/update', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ path: currentLiteraturePath, content: content })
                });
                
                const btn = document.querySelector('#literature-modal .btn-public');
                const originalText = btn.innerText;
                if (res.ok) {
                    btn.innerText = '✅ Saved';
                    setTimeout(() => btn.innerText = originalText, 1500);
                } else {
                    alert('Failed to save');
                }
            } catch (e) {
                alert('Network error');
            }
        }

        async function deleteLiteratureFromModal() {
            if (!confirm('Delete "' + currentLiteraturePath + '"?')) return;
            
            try {
                const res = await fetch('/api/literature/delete', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ path: currentLiteraturePath })
                });
                
                if (res.ok) {
                    closeLiteratureModal();
                    loadLiteratureNotes();
                } else {
                    alert('Failed to delete');
                }
            } catch (e) {
                alert('Network error');
            }
        }
        
        async function deleteLiteratureNote(path) {
            if (!confirm('Delete "' + path + '"?')) return;
            
            try {
                const res = await fetch('/api/literature/delete', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ path })
                });
                
                if (res.ok) {
                    loadLiteratureNotes();
                } else {
                    alert('Failed to delete');
                }
            } catch (e) {
                alert('Network error');
            }
        }

        // --- Permanent Notes Functions (Read-only) ---
        async function loadPermanentNotes() {
            const container = document.getElementById('permanent-grid');
            container.innerHTML = '<div class="empty-state"><div class="icon">⏳</div><h3>Loading...</h3></div>';
            
            try {
                const res = await fetch('/api/permanent');
                const notes = await res.json();
                
                if (notes.length === 0) {
                    container.innerHTML = '<div class="empty-state"><div class="icon">📌</div><h3>No Permanent Notes</h3><p>Process Inbox notes to create permanent notes.</p></div>';
                    return;
                }
                
                container.innerHTML = notes.map(note => 
                    '<div class="card ' + (note.IsSecret ? 'secret-warning' : '') + '">' +
                        '<div class="filename" onclick="viewPermanentNote(\'' + note.Path + '\')">' + note.Filename + '</div>' +
                        '<div class="actions">' +
                            '<button class="btn-edit" onclick="viewPermanentNote(\'' + note.Path + '\')">👁️ View</button>' +
                        '</div>' +
                    '</div>'
                ).join('');
            } catch (e) {
                container.innerHTML = '<div class="empty-state"><div class="icon">❌</div><h3>Failed to load</h3></div>';
            }
        }
        
        async function viewPermanentNote(path) {
            try {
                document.body.style.cursor = 'wait';
                const res = await fetch('/api/permanent/read?path=' + encodeURIComponent(path));
                if (!res.ok) throw new Error('Failed to load file');
                
                const data = await res.json();
                document.getElementById('permanent-modal-title').innerText = '📌 ' + path;
                document.getElementById('permanent-modal-content').value = data.content;
                document.getElementById('permanent-modal').classList.add('active');
            } catch (e) {
                alert('Error: ' + e.message);
            } finally {
                document.body.style.cursor = 'default';
            }
        }

        function closePermanentModal() {
            document.getElementById('permanent-modal').classList.remove('active');
        }

        // --- Structured Notes Functions (Read-only) ---
        async function loadStructuredNotes() {
            const container = document.getElementById('structured-grid');
            container.innerHTML = '<div class="empty-state"><div class="icon">⏳</div><h3>Loading...</h3></div>';
            
            try {
                const res = await fetch('/api/structured');
                const notes = await res.json();
                
                if (notes.length === 0) {
                    container.innerHTML = '<div class="empty-state"><div class="icon">📋</div><h3>No Structured Notes</h3></div>';
                    return;
                }
                
                container.innerHTML = notes.map(note => 
                    '<div class="card">' +
                        '<div class="filename" onclick="viewStructuredNote(\'' + note.Path + '\')">' + note.Filename + '</div>' +
                        '<div class="actions">' +
                            '<button class="btn-edit" onclick="viewStructuredNote(\'' + note.Path + '\')">👁️ View</button>' +
                        '</div>' +
                    '</div>'
                ).join('');
            } catch (e) {
                container.innerHTML = '<div class="empty-state"><div class="icon">❌</div><h3>Failed to load</h3></div>';
            }
        }
        
        async function viewStructuredNote(path) {
            try {
                document.body.style.cursor = 'wait';
                const res = await fetch('/api/structured/read?path=' + encodeURIComponent(path));
                if (!res.ok) throw new Error('Failed to load file');
                
                const data = await res.json();
                document.getElementById('structured-modal-title').innerText = '📋 ' + path;
                document.getElementById('structured-modal-content').value = data.content;
                document.getElementById('structured-modal').classList.add('active');
            } catch (e) {
                alert('Error: ' + e.message);
            } finally {
                document.body.style.cursor = 'default';
            }
        }

        function closeStructuredModal() {
            document.getElementById('structured-modal').classList.remove('active');
        }

        // Init
        document.addEventListener('DOMContentLoaded', () => {
            loadProjects();
            setTimeout(loadMetadataStats, 500);
        });
    </script>
</body>
</html>
`
