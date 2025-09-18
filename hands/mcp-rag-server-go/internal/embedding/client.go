package embedding

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"time"
)

type Client struct {
	apiEndpoint  string
	model        string
	dimension    int
	prefixQuery  string
	prefixEmbed  string
	httpClient   *http.Client
	logger       *log.Logger
}

type EmbeddingRequest struct {
	Model string   `json:"model"`
	Input []string `json:"input"`
}

type EmbeddingResponse struct {
	Data []struct {
		Embedding []float32 `json:"embedding"`
		Index     int       `json:"index"`
	} `json:"data"`
	Usage struct {
		PromptTokens int `json:"prompt_tokens"`
		TotalTokens  int `json:"total_tokens"`
	} `json:"usage"`
}

func NewClient(apiEndpoint, model string, dimension int, prefixQuery, prefixEmbed string, logger *log.Logger) *Client {
	if logger == nil {
		logger = log.Default()
	}

	return &Client{
		apiEndpoint: apiEndpoint,
		model:       model,
		dimension:   dimension,
		prefixQuery: prefixQuery,
		prefixEmbed: prefixEmbed,
		httpClient: &http.Client{
			Timeout: 30 * time.Second,
		},
		logger: logger,
	}
}

func (c *Client) GenerateEmbedding(text string) ([]float32, error) {
	// プレフィックスを適用
	processedText := c.prefixEmbed + text

	req := EmbeddingRequest{
		Model: c.model,
		Input: []string{processedText},
	}

	jsonData, err := json.Marshal(req)
	if err != nil {
		return nil, fmt.Errorf("リクエストのJSONエンコードに失敗: %w", err)
	}

	httpReq, err := http.NewRequest("POST", c.apiEndpoint, bytes.NewBuffer(jsonData))
	if err != nil {
		return nil, fmt.Errorf("HTTPリクエストの作成に失敗: %w", err)
	}

	httpReq.Header.Set("Content-Type", "application/json")

	resp, err := c.httpClient.Do(httpReq)
	if err != nil {
		return nil, fmt.Errorf("HTTPリクエストに失敗: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("APIエラー (ステータス: %d): %s", resp.StatusCode, string(body))
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("レスポンスの読み取りに失敗: %w", err)
	}

	var embedResp EmbeddingResponse
	if err := json.Unmarshal(body, &embedResp); err != nil {
		return nil, fmt.Errorf("レスポンスのJSONデコードに失敗: %w", err)
	}

	if len(embedResp.Data) == 0 {
		return nil, fmt.Errorf("埋め込みデータが空です")
	}

	embedding := embedResp.Data[0].Embedding
	if len(embedding) != c.dimension {
		return nil, fmt.Errorf("埋め込み次元が一致しません (期待: %d, 実際: %d)", c.dimension, len(embedding))
	}

	c.logger.Printf("埋め込み生成完了 (トークン数: %d)", embedResp.Usage.TotalTokens)

	return embedding, nil
}

func (c *Client) GenerateQueryEmbedding(query string) ([]float32, error) {
	// クエリ用プレフィックスを適用
	processedQuery := c.prefixQuery + query
	return c.GenerateEmbedding(processedQuery)
}

func (c *Client) GetDimension() int {
	return c.dimension
}

// モッククライアント（テスト用）
type MockClient struct {
	dimension int
}

func NewMockClient(dimension int) *MockClient {
	return &MockClient{dimension: dimension}
}

func (m *MockClient) GenerateEmbedding(text string) ([]float32, error) {
	// 固定値を返すモック実装
	embedding := make([]float32, m.dimension)
	for i := range embedding {
		embedding[i] = float32(i%100) / 100.0
	}
	return embedding, nil
}

func (m *MockClient) GenerateQueryEmbedding(query string) ([]float32, error) {
	return m.GenerateEmbedding(query)
}

func (m *MockClient) GetDimension() int {
	return m.dimension
}