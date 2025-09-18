package tools

import (
	"fmt"
	"strconv"
	"strings"

	"github.com/ryota/mcp-rag-server-go/internal/mcp"
	"github.com/ryota/mcp-rag-server-go/internal/rag"
)

type RAGService interface {
	SearchSimilar(query string, limit int) (*rag.SearchResponse, error)
	SearchByContent(query string, limit int) (*rag.SearchResponse, error)
	IndexDocuments(sourceDir string, incremental bool) (*rag.IndexResult, error)
	GetDocumentCount() (int, error)
	ClearAllDocuments() error
}

func RegisterRAGTools(server *mcp.Server, ragService RAGService) {
	// セマンティック検索ツール
	server.RegisterTool(mcp.Tool{
		Name:        "search_similar",
		Description: "セマンティック検索を実行してクエリに類似したドキュメントを検索します",
		InputSchema: mcp.ToolSchema{
			Type: "object",
			Properties: map[string]interface{}{
				"query": map[string]interface{}{
					"type":        "string",
					"description": "検索クエリ",
				},
				"limit": map[string]interface{}{
					"type":        "integer",
					"description": "返す結果の最大数（デフォルト: 10）",
					"default":     10,
					"minimum":     1,
					"maximum":     50,
				},
			},
			Required: []string{"query"},
		},
	}, createSearchSimilarHandler(ragService))

	// 全文検索ツール
	server.RegisterTool(mcp.Tool{
		Name:        "search_content",
		Description: "全文検索を実行してキーワードを含むドキュメントを検索します",
		InputSchema: mcp.ToolSchema{
			Type: "object",
			Properties: map[string]interface{}{
				"query": map[string]interface{}{
					"type":        "string",
					"description": "検索キーワード",
				},
				"limit": map[string]interface{}{
					"type":        "integer",
					"description": "返す結果の最大数（デフォルト: 10）",
					"default":     10,
					"minimum":     1,
					"maximum":     50,
				},
			},
			Required: []string{"query"},
		},
	}, createSearchContentHandler(ragService))

	// ドキュメントインデックス化ツール
	server.RegisterTool(mcp.Tool{
		Name:        "index_documents",
		Description: "指定されたディレクトリのドキュメントをインデックス化します",
		InputSchema: mcp.ToolSchema{
			Type: "object",
			Properties: map[string]interface{}{
				"source_dir": map[string]interface{}{
					"type":        "string",
					"description": "インデックス化するディレクトリのパス",
				},
				"incremental": map[string]interface{}{
					"type":        "boolean",
					"description": "差分インデックス化を実行するかどうか（デフォルト: false）",
					"default":     false,
				},
			},
			Required: []string{"source_dir"},
		},
	}, createIndexDocumentsHandler(ragService))

	// ドキュメント数取得ツール
	server.RegisterTool(mcp.Tool{
		Name:        "get_document_count",
		Description: "インデックス化されたドキュメントの総数を取得します",
		InputSchema: mcp.ToolSchema{
			Type:       "object",
			Properties: map[string]interface{}{},
		},
	}, createGetDocumentCountHandler(ragService))

	// ドキュメントクリアツール
	server.RegisterTool(mcp.Tool{
		Name:        "clear_documents",
		Description: "すべてのインデックス化されたドキュメントを削除します",
		InputSchema: mcp.ToolSchema{
			Type:       "object",
			Properties: map[string]interface{}{},
		},
	}, createClearDocumentsHandler(ragService))
}

func createSearchSimilarHandler(ragService RAGService) mcp.ToolHandler {
	return func(args map[string]interface{}) ([]mcp.ToolContent, error) {
		query, ok := args["query"].(string)
		if !ok || strings.TrimSpace(query) == "" {
			return []mcp.ToolContent{
				{Type: "text", Text: "エラー: 検索クエリが指定されていません"},
			}, nil
		}

		limit := 10 // デフォルト値
		if limitValue, exists := args["limit"]; exists {
			switch v := limitValue.(type) {
			case float64:
				limit = int(v)
			case int:
				limit = v
			case string:
				if parsed, err := strconv.Atoi(v); err == nil {
					limit = parsed
				}
			}
		}

		response, err := ragService.SearchSimilar(strings.TrimSpace(query), limit)
		if err != nil {
			return []mcp.ToolContent{
				{Type: "text", Text: fmt.Sprintf("検索エラー: %v", err)},
			}, nil
		}

		result := formatSearchResponse(response)
		return []mcp.ToolContent{
			{Type: "text", Text: result},
		}, nil
	}
}

func createSearchContentHandler(ragService RAGService) mcp.ToolHandler {
	return func(args map[string]interface{}) ([]mcp.ToolContent, error) {
		query, ok := args["query"].(string)
		if !ok || strings.TrimSpace(query) == "" {
			return []mcp.ToolContent{
				{Type: "text", Text: "エラー: 検索キーワードが指定されていません"},
			}, nil
		}

		limit := 10 // デフォルト値
		if limitValue, exists := args["limit"]; exists {
			switch v := limitValue.(type) {
			case float64:
				limit = int(v)
			case int:
				limit = v
			case string:
				if parsed, err := strconv.Atoi(v); err == nil {
					limit = parsed
				}
			}
		}

		response, err := ragService.SearchByContent(strings.TrimSpace(query), limit)
		if err != nil {
			return []mcp.ToolContent{
				{Type: "text", Text: fmt.Sprintf("検索エラー: %v", err)},
			}, nil
		}

		result := formatSearchResponse(response)
		return []mcp.ToolContent{
			{Type: "text", Text: result},
		}, nil
	}
}

func createIndexDocumentsHandler(ragService RAGService) mcp.ToolHandler {
	return func(args map[string]interface{}) ([]mcp.ToolContent, error) {
		sourceDir, ok := args["source_dir"].(string)
		if !ok || strings.TrimSpace(sourceDir) == "" {
			return []mcp.ToolContent{
				{Type: "text", Text: "エラー: ソースディレクトリが指定されていません"},
			}, nil
		}

		incremental := false
		if incValue, exists := args["incremental"]; exists {
			if inc, ok := incValue.(bool); ok {
				incremental = inc
			}
		}

		result, err := ragService.IndexDocuments(strings.TrimSpace(sourceDir), incremental)
		if err != nil {
			return []mcp.ToolContent{
				{Type: "text", Text: fmt.Sprintf("インデックス化エラー: %v", err)},
			}, nil
		}

		response := formatIndexResult(result)
		return []mcp.ToolContent{
			{Type: "text", Text: response},
		}, nil
	}
}

func createGetDocumentCountHandler(ragService RAGService) mcp.ToolHandler {
	return func(args map[string]interface{}) ([]mcp.ToolContent, error) {
		count, err := ragService.GetDocumentCount()
		if err != nil {
			return []mcp.ToolContent{
				{Type: "text", Text: fmt.Sprintf("ドキュメント数の取得エラー: %v", err)},
			}, nil
		}

		return []mcp.ToolContent{
			{Type: "text", Text: fmt.Sprintf("インデックス化されたドキュメント数: %d", count)},
		}, nil
	}
}

func createClearDocumentsHandler(ragService RAGService) mcp.ToolHandler {
	return func(args map[string]interface{}) ([]mcp.ToolContent, error) {
		err := ragService.ClearAllDocuments()
		if err != nil {
			return []mcp.ToolContent{
				{Type: "text", Text: fmt.Sprintf("ドキュメントクリアエラー: %v", err)},
			}, nil
		}

		return []mcp.ToolContent{
			{Type: "text", Text: "すべてのドキュメントが削除されました"},
		}, nil
	}
}

func formatSearchResponse(response *rag.SearchResponse) string {
	if len(response.Results) == 0 {
		return fmt.Sprintf("検索クエリ「%s」に一致するドキュメントは見つかりませんでした。", response.Query)
	}

	var result strings.Builder
	result.WriteString(fmt.Sprintf("検索クエリ: %s\n", response.Query))
	result.WriteString(fmt.Sprintf("見つかったドキュメント: %d件\n\n", response.TotalCount))

	for i, searchResult := range response.Results {
		doc := searchResult.Document
		result.WriteString(fmt.Sprintf("【結果 %d】\n", i+1))
		result.WriteString(fmt.Sprintf("ファイル: %s\n", doc.FileName))
		result.WriteString(fmt.Sprintf("パス: %s\n", doc.FilePath))
		result.WriteString(fmt.Sprintf("チャンク: %d\n", doc.ChunkIndex))
		result.WriteString(fmt.Sprintf("類似度: %.4f\n", searchResult.Similarity))

		// コンテンツを適切な長さで切り取り
		content := doc.Content
		if len(content) > 200 {
			content = content[:200] + "..."
		}
		result.WriteString(fmt.Sprintf("内容: %s\n", content))
		result.WriteString("---\n")
	}

	return result.String()
}

func formatIndexResult(result *rag.IndexResult) string {
	var response strings.Builder
	response.WriteString("インデックス化が完了しました。\n\n")
	response.WriteString(fmt.Sprintf("処理されたファイル数: %d\n", result.ProcessedFiles))
	response.WriteString(fmt.Sprintf("スキップされたファイル数: %d\n", result.SkippedFiles))

	if len(result.Errors) > 0 {
		response.WriteString(fmt.Sprintf("エラー数: %d\n", len(result.Errors)))
		response.WriteString("\nエラー詳細:\n")
		for i, err := range result.Errors {
			response.WriteString(fmt.Sprintf("%d. %s\n", i+1, err))
		}
	}

	return response.String()
}