package vectordb

import (
	"time"
)

// Document はベクトルデータベースに保存されるドキュメントを表します
type Document struct {
	ID         string    `json:"id"`
	FileName   string    `json:"file_name"`
	FilePath   string    `json:"file_path"`
	FileHash   string    `json:"file_hash"`
	ChunkIndex int       `json:"chunk_index"`
	Content    string    `json:"content"`
	Vector     []float32 `json:"vector,omitempty"`
	Metadata   map[string]interface{} `json:"metadata"`
	IndexedAt  time.Time `json:"indexed_at"`
}

// SearchResult は検索結果を表します
type SearchResult struct {
	Document   Document `json:"document"`
	Similarity float32  `json:"similarity"`
}

// ChunkingConfig はチャンク分割の設定を表します
type ChunkingConfig struct {
	ChunkSize    int `json:"chunk_size"`
	ChunkOverlap int `json:"chunk_overlap"`
}

// Database はベクトルデータベースのインターフェースを定義します
type Database interface {
	// 初期化
	Initialize() error
	Close() error

	// ドキュメント操作
	InsertDocument(doc Document) error
	InsertDocuments(docs []Document) error
	UpdateDocument(doc Document) error
	DeleteDocument(id string) error
	DeleteDocumentsByFile(filePath string) error

	// 検索
	SearchSimilar(vector []float32, limit int) ([]SearchResult, error)
	SearchByContent(query string, limit int) ([]SearchResult, error)

	// 統計・管理
	GetDocumentCount() (int, error)
	GetFileHashes() (map[string]string, error)
	ClearAllDocuments() error

	// ファイル管理
	IsFileIndexed(filePath string, fileHash string) (bool, error)
	GetDocumentsByFile(filePath string) ([]Document, error)
}

// EmbeddingGenerator は埋め込みベクトル生成のインターフェースを定義します
type EmbeddingGenerator interface {
	GenerateEmbedding(text string) ([]float32, error)
	GetDimension() int
}

// DocumentProcessor はドキュメント処理のインターフェースを定義します
type DocumentProcessor interface {
	ProcessFile(filePath string) ([]Document, error)
	SupportedExtensions() []string
	ChunkText(text string, config ChunkingConfig) ([]string, error)
}

// エラー定義
const (
	ErrDocumentNotFound = "document not found"
	ErrFileNotFound     = "file not found"
	ErrInvalidVector    = "invalid vector"
	ErrDatabaseError    = "database error"
)