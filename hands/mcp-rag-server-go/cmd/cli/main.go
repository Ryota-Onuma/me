package main

import (
	"flag"
	"fmt"
	"log"
	"os"

	"github.com/ryota/mcp-rag-server-go/internal/config"
	"github.com/ryota/mcp-rag-server-go/internal/document"
	"github.com/ryota/mcp-rag-server-go/internal/embedding"
	"github.com/ryota/mcp-rag-server-go/internal/rag"
	"github.com/ryota/mcp-rag-server-go/internal/vectordb"
)

func main() {
	var (
		projectName = flag.String("project", "", "プロジェクト名（必須）")
		configPath  = flag.String("config", "config/project.json", "設定ファイルのパス")
		sourceDir   = flag.String("source", "", "ソースディレクトリ（index コマンド用）")
		incremental = flag.Bool("incremental", false, "差分インデックス化を実行")
	)
	flag.Parse()

	if len(flag.Args()) == 0 {
		fmt.Fprintf(os.Stderr, "使用方法: %s [options] <command>\n", os.Args[0])
		fmt.Fprintf(os.Stderr, "\nコマンド:\n")
		fmt.Fprintf(os.Stderr, "  index      ドキュメントをインデックス化\n")
		fmt.Fprintf(os.Stderr, "  count      ドキュメント数を表示\n")
		fmt.Fprintf(os.Stderr, "  clear      すべてのドキュメントを削除\n")
		fmt.Fprintf(os.Stderr, "  search     ドキュメントを検索\n")
		fmt.Fprintf(os.Stderr, "\nオプション:\n")
		flag.PrintDefaults()
		os.Exit(1)
	}

	command := flag.Args()[0]

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

	if err := cfg.Validate(); err != nil {
		fmt.Fprintf(os.Stderr, "設定の検証に失敗: %v\n", err)
		os.Exit(1)
	}

	// ロガーの設定
	logger := log.New(os.Stderr, "[CLI] ", log.LstdFlags)

	// データベース接続
	db, err := vectordb.NewPostgresDB(cfg.PostgreSQLDSN(), cfg.PostgreSQL.Schema, logger)
	if err != nil {
		fmt.Fprintf(os.Stderr, "データベース接続に失敗: %v\n", err)
		os.Exit(1)
	}
	defer db.Close()

	// データベース初期化
	if err := db.Initialize(); err != nil {
		fmt.Fprintf(os.Stderr, "データベース初期化に失敗: %v\n", err)
		os.Exit(1)
	}

	// コマンド実行
	switch command {
	case "index":
		executeIndex(cfg, db, logger, *sourceDir, *incremental)
	case "count":
		executeCount(db, logger)
	case "clear":
		executeClear(db, logger)
	case "search":
		executeSearch(cfg, db, logger, flag.Args()[1:])
	default:
		fmt.Fprintf(os.Stderr, "不明なコマンド: %s\n", command)
		os.Exit(1)
	}
}

func executeIndex(cfg *config.Config, db vectordb.Database, logger *log.Logger, sourceDir string, incremental bool) {
	if sourceDir == "" {
		sourceDir = cfg.Paths.SourceDir
	}

	// 埋め込みクライアント初期化
	var embedClient interface {
		GenerateEmbedding(text string) ([]float32, error)
		GenerateQueryEmbedding(query string) ([]float32, error)
		GetDimension() int
	}

	if cfg.Embedding.APIEndpoint != "" {
		embedClient = embedding.NewClient(
			cfg.Embedding.APIEndpoint,
			cfg.Embedding.Model,
			cfg.Embedding.Dimension,
			cfg.Embedding.PrefixQuery,
			cfg.Embedding.PrefixEmbed,
			logger,
		)
	} else {
		embedClient = embedding.NewMockClient(cfg.Embedding.Dimension)
	}

	// ドキュメントプロセッサー初期化
	processor := document.NewProcessor(cfg.Security.MaxFileSize, logger)

	// RAGサービス初期化
	ragService := rag.NewService(cfg, db, embedClient, processor, logger)

	fmt.Printf("ドキュメントのインデックス化を開始: %s\n", sourceDir)
	if incremental {
		fmt.Println("差分モード: 変更されたファイルのみ処理します")
	}

	result, err := ragService.IndexDocuments(sourceDir, incremental)
	if err != nil {
		fmt.Fprintf(os.Stderr, "インデックス化に失敗: %v\n", err)
		os.Exit(1)
	}

	fmt.Printf("インデックス化完了!\n")
	fmt.Printf("処理されたファイル数: %d\n", result.ProcessedFiles)
	fmt.Printf("スキップされたファイル数: %d\n", result.SkippedFiles)

	if len(result.Errors) > 0 {
		fmt.Printf("エラー数: %d\n", len(result.Errors))
		fmt.Println("エラー詳細:")
		for i, errMsg := range result.Errors {
			fmt.Printf("  %d. %s\n", i+1, errMsg)
		}
	}
}

func executeCount(db vectordb.Database, logger *log.Logger) {
	count, err := db.GetDocumentCount()
	if err != nil {
		fmt.Fprintf(os.Stderr, "ドキュメント数の取得に失敗: %v\n", err)
		os.Exit(1)
	}

	fmt.Printf("インデックス化されたドキュメント数: %d\n", count)
}

func executeClear(db vectordb.Database, logger *log.Logger) {
	fmt.Print("すべてのドキュメントを削除しますか? [y/N]: ")
	var response string
	fmt.Scanln(&response)

	if response != "y" && response != "Y" {
		fmt.Println("キャンセルされました。")
		return
	}

	if err := db.ClearAllDocuments(); err != nil {
		fmt.Fprintf(os.Stderr, "ドキュメントの削除に失敗: %v\n", err)
		os.Exit(1)
	}

	fmt.Println("すべてのドキュメントが削除されました。")
}

func executeSearch(cfg *config.Config, db vectordb.Database, logger *log.Logger, args []string) {
	if len(args) == 0 {
		fmt.Fprintf(os.Stderr, "検索クエリを指定してください\n")
		os.Exit(1)
	}

	query := args[0]
	limit := 10

	// 埋め込みクライアント初期化
	var embedClient interface {
		GenerateEmbedding(text string) ([]float32, error)
		GenerateQueryEmbedding(query string) ([]float32, error)
		GetDimension() int
	}

	if cfg.Embedding.APIEndpoint != "" {
		embedClient = embedding.NewClient(
			cfg.Embedding.APIEndpoint,
			cfg.Embedding.Model,
			cfg.Embedding.Dimension,
			cfg.Embedding.PrefixQuery,
			cfg.Embedding.PrefixEmbed,
			logger,
		)
	} else {
		embedClient = embedding.NewMockClient(cfg.Embedding.Dimension)
	}

	// ドキュメントプロセッサー初期化
	processor := document.NewProcessor(cfg.Security.MaxFileSize, logger)

	// RAGサービス初期化
	ragService := rag.NewService(cfg, db, embedClient, processor, logger)

	fmt.Printf("検索実行: \"%s\"\n", query)

	response, err := ragService.SearchSimilar(query, limit)
	if err != nil {
		fmt.Fprintf(os.Stderr, "検索に失敗: %v\n", err)
		os.Exit(1)
	}

	if len(response.Results) == 0 {
		fmt.Println("該当するドキュメントが見つかりませんでした。")
		return
	}

	fmt.Printf("見つかったドキュメント: %d件\n\n", response.TotalCount)

	for i, result := range response.Results {
		doc := result.Document
		fmt.Printf("【結果 %d】\n", i+1)
		fmt.Printf("ファイル: %s\n", doc.FileName)
		fmt.Printf("パス: %s\n", doc.FilePath)
		fmt.Printf("チャンク: %d\n", doc.ChunkIndex)
		fmt.Printf("類似度: %.4f\n", result.Similarity)

		content := doc.Content
		if len(content) > 200 {
			content = content[:200] + "..."
		}
		fmt.Printf("内容: %s\n", content)
		fmt.Println("---")
	}
}