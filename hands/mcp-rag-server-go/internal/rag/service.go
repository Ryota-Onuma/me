package rag

import (
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strings"

	"github.com/ryota/mcp-rag-server-go/internal/config"
	"github.com/ryota/mcp-rag-server-go/internal/document"
	"github.com/ryota/mcp-rag-server-go/internal/vectordb"
)

type Service struct {
	config      *config.Config
	db          vectordb.Database
	embedClient interface {
		GenerateEmbedding(text string) ([]float32, error)
		GenerateQueryEmbedding(query string) ([]float32, error)
		GetDimension() int
	}
	processor *document.Processor
	logger    *log.Logger
}

func NewService(cfg *config.Config, db vectordb.Database, embedClient interface {
	GenerateEmbedding(text string) ([]float32, error)
	GenerateQueryEmbedding(query string) ([]float32, error)
	GetDimension() int
}, processor *document.Processor, logger *log.Logger) *Service {
	if logger == nil {
		logger = log.Default()
	}

	return &Service{
		config:      cfg,
		db:          db,
		embedClient: embedClient,
		processor:   processor,
		logger:      logger,
	}
}

func (s *Service) IndexDocuments(sourceDir string, incremental bool) (*IndexResult, error) {
	s.logger.Printf("ドキュメントのインデックス化を開始: %s (差分: %v)", sourceDir, incremental)

	result := &IndexResult{
		ProcessedFiles: 0,
		SkippedFiles:   0,
		Errors:         []string{},
	}

	// 既存のファイルハッシュを取得（差分処理用）
	var existingHashes map[string]string
	if incremental {
		var err error
		existingHashes, err = s.db.GetFileHashes()
		if err != nil {
			return nil, fmt.Errorf("既存ファイルハッシュの取得に失敗: %w", err)
		}
	}

	err := filepath.Walk(sourceDir, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			result.Errors = append(result.Errors, fmt.Sprintf("ファイルアクセスエラー %s: %v", path, err))
			return nil // 継続
		}

		if info.IsDir() {
			return nil
		}

		// サポートされている拡張子のみ処理
		ext := strings.ToLower(filepath.Ext(path))
		if !s.isSupportedExtension(ext) {
			return nil
		}

		// 差分処理: ファイルハッシュをチェック
		if incremental && existingHashes != nil {
			currentHash, err := s.calculateFileHash(path)
			if err != nil {
				result.Errors = append(result.Errors, fmt.Sprintf("ハッシュ計算エラー %s: %v", path, err))
				return nil
			}

			if existingHash, exists := existingHashes[path]; exists && existingHash == currentHash {
				result.SkippedFiles++
				return nil // ファイルが変更されていない場合はスキップ
			}

			// 既存のドキュメントを削除
			if err := s.db.DeleteDocumentsByFile(path); err != nil {
				s.logger.Printf("既存ドキュメントの削除に失敗: %s: %v", path, err)
			}
		}

		// ファイルを処理
		if err := s.processFile(path); err != nil {
			result.Errors = append(result.Errors, fmt.Sprintf("ファイル処理エラー %s: %v", path, err))
		} else {
			result.ProcessedFiles++
		}

		return nil
	})

	if err != nil {
		return nil, fmt.Errorf("ディレクトリの走査に失敗: %w", err)
	}

	s.logger.Printf("インデックス化完了 - 処理: %d, スキップ: %d, エラー: %d",
		result.ProcessedFiles, result.SkippedFiles, len(result.Errors))

	return result, nil
}

func (s *Service) processFile(filePath string) error {
	s.logger.Printf("ファイルを処理中: %s", filePath)

	// ドキュメント処理（チャンク分割）
	documents, err := s.processor.ProcessFile(filePath)
	if err != nil {
		return fmt.Errorf("ドキュメント処理に失敗: %w", err)
	}

	// 各チャンクに埋め込みベクトルを生成
	for i := range documents {
		embedding, err := s.embedClient.GenerateEmbedding(documents[i].Content)
		if err != nil {
			return fmt.Errorf("埋め込み生成に失敗 (チャンク %d): %w", i, err)
		}
		documents[i].Vector = embedding
	}

	// データベースに保存
	if err := s.db.InsertDocuments(documents); err != nil {
		return fmt.Errorf("データベースへの保存に失敗: %w", err)
	}

	return nil
}

func (s *Service) SearchSimilar(query string, limit int) (*SearchResponse, error) {
	if limit <= 0 || limit > s.config.Security.MaxResultLimit {
		limit = s.config.Security.MaxResultLimit
	}

	s.logger.Printf("セマンティック検索実行: \"%s\" (最大: %d件)", query, limit)

	// クエリの埋め込みベクトルを生成
	queryEmbedding, err := s.embedClient.GenerateQueryEmbedding(query)
	if err != nil {
		return nil, fmt.Errorf("クエリ埋め込みの生成に失敗: %w", err)
	}

	// ベクトル検索を実行
	results, err := s.db.SearchSimilar(queryEmbedding, limit)
	if err != nil {
		return nil, fmt.Errorf("ベクトル検索に失敗: %w", err)
	}

	response := &SearchResponse{
		Query:      query,
		Results:    results,
		TotalCount: len(results),
	}

	s.logger.Printf("検索完了: %d件のドキュメントが見つかりました", len(results))

	return response, nil
}

func (s *Service) SearchByContent(query string, limit int) (*SearchResponse, error) {
	if limit <= 0 || limit > s.config.Security.MaxResultLimit {
		limit = s.config.Security.MaxResultLimit
	}

	s.logger.Printf("全文検索実行: \"%s\" (最大: %d件)", query, limit)

	results, err := s.db.SearchByContent(query, limit)
	if err != nil {
		return nil, fmt.Errorf("全文検索に失敗: %w", err)
	}

	response := &SearchResponse{
		Query:      query,
		Results:    results,
		TotalCount: len(results),
	}

	s.logger.Printf("検索完了: %d件のドキュメントが見つかりました", len(results))

	return response, nil
}

func (s *Service) GetDocumentCount() (int, error) {
	return s.db.GetDocumentCount()
}

func (s *Service) ClearAllDocuments() error {
	s.logger.Printf("すべてのドキュメントを削除中...")
	return s.db.ClearAllDocuments()
}

func (s *Service) isSupportedExtension(ext string) bool {
	supported := s.processor.SupportedExtensions()
	for _, supportedExt := range supported {
		if ext == supportedExt {
			return true
		}
	}
	return false
}

func (s *Service) calculateFileHash(filePath string) (string, error) {
	// document.Processorの実装を利用
	docs, err := s.processor.ProcessFile(filePath)
	if err != nil {
		return "", err
	}
	if len(docs) > 0 {
		return docs[0].FileHash, nil
	}
	return "", fmt.Errorf("ファイルハッシュの取得に失敗")
}

// 結果用の構造体
type IndexResult struct {
	ProcessedFiles int      `json:"processed_files"`
	SkippedFiles   int      `json:"skipped_files"`
	Errors         []string `json:"errors"`
}

type SearchResponse struct {
	Query      string                `json:"query"`
	Results    []vectordb.SearchResult `json:"results"`
	TotalCount int                   `json:"total_count"`
}