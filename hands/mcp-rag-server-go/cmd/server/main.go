package main

import (
	"flag"
	"fmt"
	"log"
	"os"

	"github.com/ryota/mcp-rag-server-go/internal/config"
	"github.com/ryota/mcp-rag-server-go/internal/document"
	"github.com/ryota/mcp-rag-server-go/internal/embedding"
	"github.com/ryota/mcp-rag-server-go/internal/mcp"
	"github.com/ryota/mcp-rag-server-go/internal/rag"
	"github.com/ryota/mcp-rag-server-go/internal/vectordb"
	"github.com/ryota/mcp-rag-server-go/pkg/tools"
)

func main() {
	var (
		projectName = flag.String("project", "", "プロジェクト名（必須）")
		configPath  = flag.String("config", "config/project.json", "設定ファイルのパス")
		name        = flag.String("name", "mcp-rag-server-go", "サーバー名")
		version     = flag.String("version", "1.0.0", "サーバーバージョン")
		description = flag.String("description", "MCP RAG Server - Go implementation", "サーバーの説明")
	)
	flag.Parse()

	// プロジェクト名の確認
	if *projectName == "" {
		if envProject := os.Getenv("PROJECT"); envProject != "" {
			*projectName = envProject
		} else {
			fmt.Fprintf(os.Stderr, "エラー: プロジェクト名が指定されていません。-project フラグまたは PROJECT 環境変数を設定してください。\n")
			os.Exit(1)
		}
	}

	// 設定読み込み
	cfg, err := config.LoadConfig(*configPath, *projectName)
	if err != nil {
		fmt.Fprintf(os.Stderr, "設定の読み込みに失敗: %v\n", err)
		os.Exit(1)
	}

	// 設定の検証
	if err := cfg.Validate(); err != nil {
		fmt.Fprintf(os.Stderr, "設定の検証に失敗: %v\n", err)
		os.Exit(1)
	}

	// ロガーの設定
	logger := log.New(os.Stderr, "[MCP-RAG] ", log.LstdFlags)

	if cfg.Logging.EnableFile {
		if err := os.MkdirAll("logs", 0755); err != nil {
			logger.Printf("警告: ログディレクトリの作成に失敗: %v", err)
		}
	}

	logger.Printf("%s %s を起動中...", *name, *version)
	logger.Printf("プロジェクト: %s", cfg.Project)

	// データベース接続
	db, err := vectordb.NewPostgresDB(cfg.PostgreSQLDSN(), cfg.PostgreSQL.Schema, logger)
	if err != nil {
		logger.Fatalf("データベース接続に失敗: %v", err)
	}
	defer db.Close()

	// データベース初期化
	if err := db.Initialize(); err != nil {
		logger.Fatalf("データベース初期化に失敗: %v", err)
	}

	// 埋め込みクライアント初期化
	var embedClient interface {
		GenerateEmbedding(text string) ([]float32, error)
		GenerateQueryEmbedding(query string) ([]float32, error)
		GetDimension() int
	}

	if cfg.Embedding.APIEndpoint != "" {
		// 外部APIを使用
		embedClient = embedding.NewClient(
			cfg.Embedding.APIEndpoint,
			cfg.Embedding.Model,
			cfg.Embedding.Dimension,
			cfg.Embedding.PrefixQuery,
			cfg.Embedding.PrefixEmbed,
			logger,
		)
		logger.Printf("埋め込みクライアント: 外部API (%s)", cfg.Embedding.APIEndpoint)
	} else {
		// モッククライアントを使用（テスト用）
		embedClient = embedding.NewMockClient(cfg.Embedding.Dimension)
		logger.Printf("埋め込みクライアント: モック (次元数: %d)", cfg.Embedding.Dimension)
	}

	// ドキュメントプロセッサー初期化
	processor := document.NewProcessor(cfg.Security.MaxFileSize, logger)

	// RAGサービス初期化
	ragService := rag.NewService(cfg, db, embedClient, processor, logger)

	// MCPサーバー初期化
	server := mcp.NewServer(*name, *version, *description)

	// RAGツールを登録
	tools.RegisterRAGTools(server, ragService)

	logger.Printf("RAGツールが登録されました")

	// サーバー開始
	logger.Printf("サーバーを開始します...")
	if err := server.Start(); err != nil {
		logger.Fatalf("サーバーの実行に失敗: %v", err)
	}
}