package vectordb

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"

	_ "github.com/lib/pq"
	"github.com/pgvector/pgvector-go"
)

type PostgresDB struct {
	db        *sql.DB
	schema    string
	tableName string
	logger    *log.Logger
}

func NewPostgresDB(dsn string, schema string, logger *log.Logger) (*PostgresDB, error) {
	if logger == nil {
		logger = log.Default()
	}

	db, err := sql.Open("postgres", dsn)
	if err != nil {
		return nil, fmt.Errorf("データベース接続エラー: %w", err)
	}

	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("データベースへの接続確認に失敗: %w", err)
	}

	return &PostgresDB{
		db:        db,
		schema:    schema,
		tableName: "documents",
		logger:    logger,
	}, nil
}

func (p *PostgresDB) Initialize() error {
	// pgvector拡張を有効化
	if err := p.enablePgVector(); err != nil {
		return fmt.Errorf("pgvector拡張の有効化に失敗: %w", err)
	}

	// スキーマを作成
	if err := p.createSchema(); err != nil {
		return fmt.Errorf("スキーマの作成に失敗: %w", err)
	}

	// テーブルを作成
	if err := p.createTables(); err != nil {
		return fmt.Errorf("テーブルの作成に失敗: %w", err)
	}

	// インデックスを作成
	if err := p.createIndexes(); err != nil {
		return fmt.Errorf("インデックスの作成に失敗: %w", err)
	}

	p.logger.Printf("PostgreSQL データベースが初期化されました (スキーマ: %s)", p.schema)
	return nil
}

func (p *PostgresDB) enablePgVector() error {
	_, err := p.db.Exec("CREATE EXTENSION IF NOT EXISTS vector")
	return err
}

func (p *PostgresDB) createSchema() error {
	query := fmt.Sprintf("CREATE SCHEMA IF NOT EXISTS %s", p.schema)
	_, err := p.db.Exec(query)
	return err
}

func (p *PostgresDB) createTables() error {
	query := fmt.Sprintf(`
		CREATE TABLE IF NOT EXISTS %s.%s (
			id VARCHAR(255) PRIMARY KEY,
			file_name VARCHAR(255) NOT NULL,
			file_path TEXT NOT NULL,
			file_hash VARCHAR(64) NOT NULL,
			chunk_index INTEGER NOT NULL,
			content TEXT NOT NULL,
			vector vector(1024),
			metadata JSONB,
			indexed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
		)`, p.schema, p.tableName)

	_, err := p.db.Exec(query)
	return err
}

func (p *PostgresDB) createIndexes() error {
	indexes := []string{
		fmt.Sprintf("CREATE INDEX IF NOT EXISTS idx_%s_file_path ON %s.%s (file_path)", p.tableName, p.schema, p.tableName),
		fmt.Sprintf("CREATE INDEX IF NOT EXISTS idx_%s_file_hash ON %s.%s (file_hash)", p.tableName, p.schema, p.tableName),
		fmt.Sprintf("CREATE INDEX IF NOT EXISTS idx_%s_vector ON %s.%s USING hnsw (vector vector_cosine_ops)", p.tableName, p.schema, p.tableName),
	}

	for _, indexQuery := range indexes {
		if _, err := p.db.Exec(indexQuery); err != nil {
			p.logger.Printf("インデックス作成警告: %v", err)
			// インデックス作成の失敗は継続可能
		}
	}

	return nil
}

func (p *PostgresDB) Close() error {
	return p.db.Close()
}

func (p *PostgresDB) InsertDocument(doc Document) error {
	vector := pgvector.NewVector(doc.Vector)
	metadataBytes, _ := json.Marshal(doc.Metadata)

	query := fmt.Sprintf(`
		INSERT INTO %s.%s (id, file_name, file_path, file_hash, chunk_index, content, vector, metadata, indexed_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		ON CONFLICT (id) DO UPDATE SET
			file_name = EXCLUDED.file_name,
			file_path = EXCLUDED.file_path,
			file_hash = EXCLUDED.file_hash,
			chunk_index = EXCLUDED.chunk_index,
			content = EXCLUDED.content,
			vector = EXCLUDED.vector,
			metadata = EXCLUDED.metadata,
			indexed_at = EXCLUDED.indexed_at
	`, p.schema, p.tableName)

	_, err := p.db.Exec(query, doc.ID, doc.FileName, doc.FilePath, doc.FileHash,
		doc.ChunkIndex, doc.Content, vector, metadataBytes, doc.IndexedAt)

	return err
}

func (p *PostgresDB) InsertDocuments(docs []Document) error {
	tx, err := p.db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	stmt, err := tx.Prepare(fmt.Sprintf(`
		INSERT INTO %s.%s (id, file_name, file_path, file_hash, chunk_index, content, vector, metadata, indexed_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		ON CONFLICT (id) DO UPDATE SET
			file_name = EXCLUDED.file_name,
			file_path = EXCLUDED.file_path,
			file_hash = EXCLUDED.file_hash,
			chunk_index = EXCLUDED.chunk_index,
			content = EXCLUDED.content,
			vector = EXCLUDED.vector,
			metadata = EXCLUDED.metadata,
			indexed_at = EXCLUDED.indexed_at
	`, p.schema, p.tableName))
	if err != nil {
		return err
	}
	defer stmt.Close()

	for _, doc := range docs {
		vector := pgvector.NewVector(doc.Vector)
		metadataBytes, _ := json.Marshal(doc.Metadata)

		_, err := stmt.Exec(doc.ID, doc.FileName, doc.FilePath, doc.FileHash,
			doc.ChunkIndex, doc.Content, vector, metadataBytes, doc.IndexedAt)
		if err != nil {
			return err
		}
	}

	return tx.Commit()
}

func (p *PostgresDB) UpdateDocument(doc Document) error {
	return p.InsertDocument(doc) // UpsertなのでInsertと同じ
}

func (p *PostgresDB) DeleteDocument(id string) error {
	query := fmt.Sprintf("DELETE FROM %s.%s WHERE id = $1", p.schema, p.tableName)
	_, err := p.db.Exec(query, id)
	return err
}

func (p *PostgresDB) DeleteDocumentsByFile(filePath string) error {
	query := fmt.Sprintf("DELETE FROM %s.%s WHERE file_path = $1", p.schema, p.tableName)
	result, err := p.db.Exec(query, filePath)
	if err != nil {
		return err
	}

	rowsAffected, _ := result.RowsAffected()
	p.logger.Printf("削除されたドキュメント数: %d (ファイル: %s)", rowsAffected, filePath)

	return nil
}

func (p *PostgresDB) SearchSimilar(vector []float32, limit int) ([]SearchResult, error) {
	queryVector := pgvector.NewVector(vector)

	query := fmt.Sprintf(`
		SELECT id, file_name, file_path, file_hash, chunk_index, content, metadata, indexed_at,
		       1 - (vector <=> $1) AS similarity
		FROM %s.%s
		WHERE vector IS NOT NULL
		ORDER BY vector <=> $1
		LIMIT $2
	`, p.schema, p.tableName)

	rows, err := p.db.Query(query, queryVector, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var results []SearchResult
	for rows.Next() {
		var doc Document
		var metadataBytes []byte
		var similarity float32

		err := rows.Scan(&doc.ID, &doc.FileName, &doc.FilePath, &doc.FileHash,
			&doc.ChunkIndex, &doc.Content, &metadataBytes, &doc.IndexedAt, &similarity)
		if err != nil {
			return nil, err
		}

		if metadataBytes != nil {
			json.Unmarshal(metadataBytes, &doc.Metadata)
		}

		results = append(results, SearchResult{
			Document:   doc,
			Similarity: similarity,
		})
	}

	return results, nil
}

func (p *PostgresDB) SearchByContent(query string, limit int) ([]SearchResult, error) {
	searchQuery := fmt.Sprintf(`
		SELECT id, file_name, file_path, file_hash, chunk_index, content, metadata, indexed_at,
		       ts_rank(to_tsvector('japanese', content), plainto_tsquery('japanese', $1)) AS rank
		FROM %s.%s
		WHERE to_tsvector('japanese', content) @@ plainto_tsquery('japanese', $1)
		ORDER BY ts_rank(to_tsvector('japanese', content), plainto_tsquery('japanese', $1)) DESC
		LIMIT $2
	`, p.schema, p.tableName)

	rows, err := p.db.Query(searchQuery, query, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var results []SearchResult
	for rows.Next() {
		var doc Document
		var metadataBytes []byte
		var rank float32

		err := rows.Scan(&doc.ID, &doc.FileName, &doc.FilePath, &doc.FileHash,
			&doc.ChunkIndex, &doc.Content, &metadataBytes, &doc.IndexedAt, &rank)
		if err != nil {
			return nil, err
		}

		if metadataBytes != nil {
			json.Unmarshal(metadataBytes, &doc.Metadata)
		}

		results = append(results, SearchResult{
			Document:   doc,
			Similarity: rank,
		})
	}

	return results, nil
}

func (p *PostgresDB) GetDocumentCount() (int, error) {
	query := fmt.Sprintf("SELECT COUNT(*) FROM %s.%s", p.schema, p.tableName)
	var count int
	err := p.db.QueryRow(query).Scan(&count)
	return count, err
}

func (p *PostgresDB) GetFileHashes() (map[string]string, error) {
	query := fmt.Sprintf("SELECT DISTINCT file_path, file_hash FROM %s.%s", p.schema, p.tableName)
	rows, err := p.db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	hashes := make(map[string]string)
	for rows.Next() {
		var filePath, fileHash string
		if err := rows.Scan(&filePath, &fileHash); err != nil {
			return nil, err
		}
		hashes[filePath] = fileHash
	}

	return hashes, nil
}

func (p *PostgresDB) ClearAllDocuments() error {
	query := fmt.Sprintf("TRUNCATE TABLE %s.%s", p.schema, p.tableName)
	_, err := p.db.Exec(query)
	return err
}

func (p *PostgresDB) IsFileIndexed(filePath string, fileHash string) (bool, error) {
	query := fmt.Sprintf("SELECT COUNT(*) FROM %s.%s WHERE file_path = $1 AND file_hash = $2", p.schema, p.tableName)
	var count int
	err := p.db.QueryRow(query, filePath, fileHash).Scan(&count)
	return count > 0, err
}

func (p *PostgresDB) GetDocumentsByFile(filePath string) ([]Document, error) {
	query := fmt.Sprintf(`
		SELECT id, file_name, file_path, file_hash, chunk_index, content, metadata, indexed_at
		FROM %s.%s
		WHERE file_path = $1
		ORDER BY chunk_index
	`, p.schema, p.tableName)

	rows, err := p.db.Query(query, filePath)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var documents []Document
	for rows.Next() {
		var doc Document
		var metadataBytes []byte

		err := rows.Scan(&doc.ID, &doc.FileName, &doc.FilePath, &doc.FileHash,
			&doc.ChunkIndex, &doc.Content, &metadataBytes, &doc.IndexedAt)
		if err != nil {
			return nil, err
		}

		if metadataBytes != nil {
			json.Unmarshal(metadataBytes, &doc.Metadata)
		}

		documents = append(documents, doc)
	}

	return documents, nil
}