package document

import (
	"crypto/sha256"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"time"
	"unicode"
	"unicode/utf8"

	"github.com/ryota/mcp-rag-server-go/internal/vectordb"
)

type Processor struct {
	maxFileSize int
	logger      interface {
		Printf(format string, v ...interface{})
	}
}

func NewProcessor(maxFileSize int, logger interface{ Printf(format string, v ...interface{}) }) *Processor {
	return &Processor{
		maxFileSize: maxFileSize,
		logger:      logger,
	}
}

func (p *Processor) ProcessFile(filePath string) ([]vectordb.Document, error) {
	// ファイルサイズチェック
	fileInfo, err := os.Stat(filePath)
	if err != nil {
		return nil, fmt.Errorf("ファイル情報の取得に失敗: %w", err)
	}

	if fileInfo.Size() > int64(p.maxFileSize) {
		return nil, fmt.Errorf("ファイルサイズが大きすぎます: %d bytes (最大: %d bytes)", fileInfo.Size(), p.maxFileSize)
	}

	// ファイル拡張子チェック
	ext := strings.ToLower(filepath.Ext(filePath))
	if !p.isSupportedExtension(ext) {
		return nil, fmt.Errorf("サポートされていないファイル形式: %s", ext)
	}

	// ファイルハッシュの計算
	fileHash, err := p.calculateFileHash(filePath)
	if err != nil {
		return nil, fmt.Errorf("ファイルハッシュの計算に失敗: %w", err)
	}

	// ファイル内容の読み取り
	content, err := p.readFileContent(filePath, ext)
	if err != nil {
		return nil, fmt.Errorf("ファイル内容の読み取りに失敗: %w", err)
	}

	// テキストのクリーニング
	cleanedContent := p.cleanText(content)

	// チャンク分割
	chunks, err := p.ChunkText(cleanedContent, vectordb.ChunkingConfig{
		ChunkSize:    500,
		ChunkOverlap: 100,
	})
	if err != nil {
		return nil, fmt.Errorf("チャンク分割に失敗: %w", err)
	}

	// ドキュメント作成
	documents := make([]vectordb.Document, 0, len(chunks))
	fileName := filepath.Base(filePath)
	now := time.Now()

	for i, chunk := range chunks {
		docID := fmt.Sprintf("%s_%d", fileHash, i)

		doc := vectordb.Document{
			ID:         docID,
			FileName:   fileName,
			FilePath:   filePath,
			FileHash:   fileHash,
			ChunkIndex: i,
			Content:    chunk,
			Metadata: map[string]interface{}{
				"file_extension": ext,
				"file_size":      fileInfo.Size(),
				"chunk_count":    len(chunks),
			},
			IndexedAt: now,
		}

		documents = append(documents, doc)
	}

	p.logger.Printf("ファイル処理完了: %s (%d チャンク)", filePath, len(chunks))

	return documents, nil
}

func (p *Processor) SupportedExtensions() []string {
	return []string{".txt", ".md", ".markdown"}
	// TODO: PDF, Word, PowerPointサポートを追加
}

func (p *Processor) isSupportedExtension(ext string) bool {
	supported := p.SupportedExtensions()
	for _, supportedExt := range supported {
		if ext == supportedExt {
			return true
		}
	}
	return false
}

func (p *Processor) calculateFileHash(filePath string) (string, error) {
	file, err := os.Open(filePath)
	if err != nil {
		return "", err
	}
	defer file.Close()

	hasher := sha256.New()
	if _, err := io.Copy(hasher, file); err != nil {
		return "", err
	}

	return fmt.Sprintf("%x", hasher.Sum(nil)), nil
}

func (p *Processor) readFileContent(filePath string, ext string) (string, error) {
	switch ext {
	case ".txt", ".md", ".markdown":
		return p.readTextFile(filePath)
	default:
		return "", fmt.Errorf("未対応のファイル形式: %s", ext)
	}
}

func (p *Processor) readTextFile(filePath string) (string, error) {
	data, err := os.ReadFile(filePath)
	if err != nil {
		return "", err
	}

	// UTF-8として読み取り、無効なバイトは削除
	content := string(data)
	if !utf8.ValidString(content) {
		content = strings.ToValidUTF8(content, "")
	}

	return content, nil
}

func (p *Processor) cleanText(text string) string {
	// 制御文字を削除（改行とタブは保持）
	text = regexp.MustCompile(`[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]`).ReplaceAllString(text, "")

	// 連続する空白を単一スペースに変換
	text = regexp.MustCompile(`[　\s]+`).ReplaceAllString(text, " ")

	// 連続する改行を最大2つに制限
	text = regexp.MustCompile(`\n{3,}`).ReplaceAllString(text, "\n\n")

	return strings.TrimSpace(text)
}

func (p *Processor) ChunkText(text string, config vectordb.ChunkingConfig) ([]string, error) {
	if config.ChunkSize <= 0 {
		return []string{text}, nil
	}

	// 文章を改行で分割
	paragraphs := strings.Split(text, "\n")
	chunks := []string{}
	currentChunk := ""

	for _, paragraph := range paragraphs {
		paragraph = strings.TrimSpace(paragraph)
		if paragraph == "" {
			continue
		}

		// 現在のチャンクに段落を追加できるかチェック
		testChunk := currentChunk
		if testChunk != "" {
			testChunk += "\n"
		}
		testChunk += paragraph

		if p.getTextLength(testChunk) <= config.ChunkSize {
			currentChunk = testChunk
		} else {
			// 現在のチャンクを保存し、新しいチャンクを開始
			if currentChunk != "" {
				chunks = append(chunks, currentChunk)
			}

			// 段落が単体でも大きすぎる場合は分割
			if p.getTextLength(paragraph) > config.ChunkSize {
				subChunks := p.splitLargeText(paragraph, config.ChunkSize)
				chunks = append(chunks, subChunks...)
				currentChunk = ""
			} else {
				currentChunk = paragraph
			}
		}
	}

	// 最後のチャンクを追加
	if currentChunk != "" {
		chunks = append(chunks, currentChunk)
	}

	// オーバーラップを適用
	if config.ChunkOverlap > 0 && len(chunks) > 1 {
		chunks = p.applyOverlap(chunks, config.ChunkOverlap)
	}

	return chunks, nil
}

func (p *Processor) getTextLength(text string) int {
	// 日本語文字は2文字分として計算
	length := 0
	for _, r := range text {
		if p.isJapanese(r) {
			length += 2
		} else {
			length += 1
		}
	}
	return length
}

func (p *Processor) isJapanese(r rune) bool {
	return unicode.In(r, unicode.Hiragana, unicode.Katakana, unicode.Han)
}

func (p *Processor) splitLargeText(text string, maxSize int) []string {
	words := strings.Fields(text)
	chunks := []string{}
	currentChunk := ""

	for _, word := range words {
		testChunk := currentChunk
		if testChunk != "" {
			testChunk += " "
		}
		testChunk += word

		if p.getTextLength(testChunk) <= maxSize {
			currentChunk = testChunk
		} else {
			if currentChunk != "" {
				chunks = append(chunks, currentChunk)
			}
			currentChunk = word
		}
	}

	if currentChunk != "" {
		chunks = append(chunks, currentChunk)
	}

	return chunks
}

func (p *Processor) applyOverlap(chunks []string, overlapSize int) []string {
	if len(chunks) <= 1 {
		return chunks
	}

	overlappedChunks := []string{chunks[0]} // 最初のチャンクはそのまま

	for i := 1; i < len(chunks); i++ {
		prevChunk := chunks[i-1]
		currentChunk := chunks[i]

		// 前のチャンクの末尾から重複部分を抽出
		overlapText := p.extractTailText(prevChunk, overlapSize)

		// 重複部分を現在のチャンクの先頭に追加
		if overlapText != "" {
			currentChunk = overlapText + "\n" + currentChunk
		}

		overlappedChunks = append(overlappedChunks, currentChunk)
	}

	return overlappedChunks
}

func (p *Processor) extractTailText(text string, maxLength int) string {
	if p.getTextLength(text) <= maxLength {
		return text
	}

	// 末尾から指定された長さの文字を抽出
	runes := []rune(text)
	currentLength := 0
	startIndex := len(runes)

	for i := len(runes) - 1; i >= 0; i-- {
		if p.isJapanese(runes[i]) {
			currentLength += 2
		} else {
			currentLength += 1
		}

		if currentLength > maxLength {
			startIndex = i + 1
			break
		}
		startIndex = i
	}

	return string(runes[startIndex:])
}