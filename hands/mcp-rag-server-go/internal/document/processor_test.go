package document

import (
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/ryota/mcp-rag-server-go/internal/vectordb"
)

type testLogger struct{}

func (tl *testLogger) Printf(format string, v ...interface{}) {
	// テスト用ロガー（何もしない）
}

func TestChunkText(t *testing.T) {
	processor := NewProcessor(1024*1024, &testLogger{})

	text := "これは最初の段落です。\n\nこれは二番目の段落です。長いテキストを含んでいます。\n\nこれは三番目の段落です。"

	config := vectordb.ChunkingConfig{
		ChunkSize:    50,
		ChunkOverlap: 10,
	}

	chunks, err := processor.ChunkText(text, config)
	if err != nil {
		t.Fatalf("テキストのチャンク化に失敗: %v", err)
	}

	if len(chunks) == 0 {
		t.Error("チャンクが生成されませんでした")
	}

	// 各チャンクが最大サイズを超えていないかチェック
	for i, chunk := range chunks {
		if processor.getTextLength(chunk) > config.ChunkSize+config.ChunkOverlap {
			t.Errorf("チャンク %d がサイズ制限を超えています: %d > %d", i, processor.getTextLength(chunk), config.ChunkSize+config.ChunkOverlap)
		}
	}

	t.Logf("生成されたチャンク数: %d", len(chunks))
	for i, chunk := range chunks {
		t.Logf("チャンク %d (長さ: %d): %s", i, processor.getTextLength(chunk), chunk)
	}
}

func TestCleanText(t *testing.T) {
	processor := NewProcessor(1024*1024, &testLogger{})

	tests := []struct {
		name     string
		input    string
		expected string
	}{
		{
			name:     "連続する空白",
			input:    "これは    複数の    空白です",
			expected: "これは 複数の 空白です",
		},
		{
			name:     "連続する改行",
			input:    "最初の行\n\n\n\n複数の改行\n\n\n最後の行",
			expected: "最初の行\n\n複数の改行\n\n最後の行",
		},
		{
			name:     "先頭と末尾の空白",
			input:    "   前後に空白があります   ",
			expected: "前後に空白があります",
		},
		{
			name:     "全角スペース",
			input:    "全角　　スペース　があります",
			expected: "全角 スペース があります",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := processor.cleanText(tt.input)
			if result != tt.expected {
				t.Errorf("クリーニング結果が期待と異なります:\n期待: %q\n実際: %q", tt.expected, result)
			}
		})
	}
}

func TestGetTextLength(t *testing.T) {
	processor := NewProcessor(1024*1024, &testLogger{})

	tests := []struct {
		text     string
		expected int
	}{
		{"Hello", 5},          // 英語: 1文字=1
		{"こんにちは", 10},        // 日本語: 1文字=2
		{"Hello世界", 9},        // 混合: 5 + 4
		{"", 0},               // 空文字
		{"Hello\nWorld", 11},  // 改行を含む
	}

	for _, tt := range tests {
		t.Run(tt.text, func(t *testing.T) {
			result := processor.getTextLength(tt.text)
			if result != tt.expected {
				t.Errorf("文字数計算が間違っています: テキスト=%q, 期待=%d, 実際=%d", tt.text, tt.expected, result)
			}
		})
	}
}

func TestProcessFile(t *testing.T) {
	processor := NewProcessor(1024*1024, &testLogger{})

	// テスト用のテキストファイルを作成
	tempDir := t.TempDir()
	testFile := filepath.Join(tempDir, "test.txt")

	content := "これはテストファイルです。\n\n複数の段落があります。\n\nここまでがテストファイルの内容です。"
	if err := os.WriteFile(testFile, []byte(content), 0644); err != nil {
		t.Fatalf("テストファイルの作成に失敗: %v", err)
	}

	documents, err := processor.ProcessFile(testFile)
	if err != nil {
		t.Fatalf("ファイル処理に失敗: %v", err)
	}

	if len(documents) == 0 {
		t.Error("ドキュメントが生成されませんでした")
	}

	// 最初のドキュメントをチェック
	doc := documents[0]
	if doc.FileName != "test.txt" {
		t.Errorf("ファイル名が一致しません: 期待=%s, 実際=%s", "test.txt", doc.FileName)
	}

	if doc.FilePath != testFile {
		t.Errorf("ファイルパスが一致しません: 期待=%s, 実際=%s", testFile, doc.FilePath)
	}

	if doc.FileHash == "" {
		t.Error("ファイルハッシュが空です")
	}

	if doc.ChunkIndex != 0 {
		t.Errorf("チャンクインデックスが期待値と異なります: 期待=%d, 実際=%d", 0, doc.ChunkIndex)
	}

	if doc.Content == "" {
		t.Error("コンテンツが空です")
	}

	t.Logf("生成されたドキュメント数: %d", len(documents))
	for i, doc := range documents {
		t.Logf("ドキュメント %d: ファイル=%s, チャンク=%d, 長さ=%d",
			i, doc.FileName, doc.ChunkIndex, len(doc.Content))
	}
}

func TestSupportedExtensions(t *testing.T) {
	processor := NewProcessor(1024*1024, &testLogger{})

	supportedExts := processor.SupportedExtensions()

	expectedExts := []string{".txt", ".md", ".markdown"}

	if len(supportedExts) != len(expectedExts) {
		t.Errorf("サポートされている拡張子の数が一致しません: 期待=%d, 実際=%d",
			len(expectedExts), len(supportedExts))
	}

	for _, expected := range expectedExts {
		found := false
		for _, actual := range supportedExts {
			if actual == expected {
				found = true
				break
			}
		}
		if !found {
			t.Errorf("期待される拡張子が見つかりません: %s", expected)
		}
	}
}

func TestProcessUnsupportedFile(t *testing.T) {
	processor := NewProcessor(1024*1024, &testLogger{})

	// サポートされていない拡張子のファイルを作成
	tempDir := t.TempDir()
	testFile := filepath.Join(tempDir, "test.xyz")

	content := "これはサポートされていないファイルです。"
	if err := os.WriteFile(testFile, []byte(content), 0644); err != nil {
		t.Fatalf("テストファイルの作成に失敗: %v", err)
	}

	_, err := processor.ProcessFile(testFile)
	if err == nil {
		t.Error("サポートされていないファイル形式でもエラーが発生しませんでした")
	}

	if !strings.Contains(err.Error(), "サポートされていないファイル形式") {
		t.Errorf("期待されるエラーメッセージが含まれていません: %v", err)
	}
}

func TestProcessLargeFile(t *testing.T) {
	maxSize := 100 // 100バイトの制限
	processor := NewProcessor(maxSize, &testLogger{})

	// 制限を超えるサイズのファイルを作成
	tempDir := t.TempDir()
	testFile := filepath.Join(tempDir, "large.txt")

	largeContent := strings.Repeat("これは大きなファイルです。", 20) // 100バイトを超える
	if err := os.WriteFile(testFile, []byte(largeContent), 0644); err != nil {
		t.Fatalf("テストファイルの作成に失敗: %v", err)
	}

	_, err := processor.ProcessFile(testFile)
	if err == nil {
		t.Error("ファイルサイズ制限を超えてもエラーが発生しませんでした")
	}

	if !strings.Contains(err.Error(), "ファイルサイズが大きすぎます") {
		t.Errorf("期待されるエラーメッセージが含まれていません: %v", err)
	}
}