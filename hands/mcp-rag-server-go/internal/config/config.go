package config

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"strconv"

	"github.com/joho/godotenv"
)

type Config struct {
	Project      string           `json:"project"`
	PostgreSQL   PostgreSQLConfig `json:"postgres"`
	Embedding    EmbeddingConfig  `json:"embedding"`
	Paths        PathsConfig      `json:"paths"`
	Security     SecurityConfig   `json:"security"`
	Logging      LoggingConfig    `json:"logging"`
	Server       ServerConfig     `json:"server"`
}

type PostgreSQLConfig struct {
	Host     string `json:"host"`
	Port     int    `json:"port"`
	User     string `json:"user"`
	Password string `json:"password"`
	Database string `json:"db"`
	Schema   string `json:"schema"`
}

type EmbeddingConfig struct {
	Model        string `json:"model"`
	Dimension    int    `json:"dim"`
	PrefixQuery  string `json:"prefix_query"`
	PrefixEmbed  string `json:"prefix_embedding"`
	APIEndpoint  string `json:"api_endpoint"`
}

type PathsConfig struct {
	SourceDir    string `json:"source_dir"`
	ProcessedDir string `json:"processed_dir"`
}

type SecurityConfig struct {
	MaxQueryLength  int `json:"max_query_length"`
	MaxResultLimit  int `json:"max_result_limit"`
	MaxFileSize     int `json:"max_file_size"`
}

type LoggingConfig struct {
	EnableFile bool   `json:"enable_file_logging"`
	Level      string `json:"level"`
}

type ServerConfig struct {
	Name        string `json:"name"`
	Version     string `json:"version"`
	Description string `json:"description"`
}

func LoadConfig(configPath string, projectName string) (*Config, error) {
	config := &Config{
		PostgreSQL: PostgreSQLConfig{
			Host:     "localhost",
			Port:     5432,
			User:     "postgres",
			Password: "",
			Database: "rag_db",
			Schema:   "public",
		},
		Embedding: EmbeddingConfig{
			Model:       "intfloat/multilingual-e5-large",
			Dimension:   1024,
			PrefixQuery: "",
			PrefixEmbed: "",
		},
		Paths: PathsConfig{
			SourceDir:    "data/source",
			ProcessedDir: "data/processed",
		},
		Security: SecurityConfig{
			MaxQueryLength: 2000,
			MaxResultLimit: 50,
			MaxFileSize:    100 * 1024 * 1024, // 100MB
		},
		Logging: LoggingConfig{
			EnableFile: false,
			Level:      "INFO",
		},
		Server: ServerConfig{
			Name:        "mcp-rag-server-go",
			Version:     "1.0.0",
			Description: "MCP RAG Server - Go implementation",
		},
	}

	// .envファイルから環境変数をロード
	if err := godotenv.Load(); err != nil {
		// .envファイルが存在しない場合はエラーにしない
	}

	// JSONファイルから設定をロード
	if configPath != "" {
		if err := loadFromJSON(config, configPath, projectName); err != nil {
			return nil, fmt.Errorf("JSONファイルからの設定読み込みに失敗: %w", err)
		}
	}

	// 環境変数から設定を上書き
	overrideFromEnv(config)

	// プロジェクト名を設定
	if projectName != "" {
		config.Project = projectName
	}

	// デフォルトのスキーマ名を設定（プロジェクト名がある場合）
	if config.Project != "" && config.PostgreSQL.Schema == "public" {
		config.PostgreSQL.Schema = config.Project
	}

	return config, nil
}

func loadFromJSON(config *Config, configPath string, projectName string) error {
	data, err := os.ReadFile(configPath)
	if err != nil {
		return err
	}

	var jsonConfig map[string]interface{}
	if err := json.Unmarshal(data, &jsonConfig); err != nil {
		return err
	}

	// マルチプロジェクト形式の場合
	if projects, exists := jsonConfig["projects"]; exists {
		if projectsMap, ok := projects.(map[string]interface{}); ok {
			if projectConfig, exists := projectsMap[projectName]; exists {
				if projectData, ok := projectConfig.(map[string]interface{}); ok {
					return applyJSONConfig(config, projectData)
				}
			}
		}
		return fmt.Errorf("プロジェクト '%s' が見つかりません", projectName)
	}

	// フラット形式の場合
	return applyJSONConfig(config, jsonConfig)
}

func applyJSONConfig(config *Config, jsonConfig map[string]interface{}) error {
	data, err := json.Marshal(jsonConfig)
	if err != nil {
		return err
	}

	return json.Unmarshal(data, config)
}

func overrideFromEnv(config *Config) {
	if val := os.Getenv("PROJECT"); val != "" {
		config.Project = val
	}

	// PostgreSQL
	if val := os.Getenv("POSTGRES_HOST"); val != "" {
		config.PostgreSQL.Host = val
	}
	if val := os.Getenv("POSTGRES_PORT"); val != "" {
		if port, err := strconv.Atoi(val); err == nil {
			config.PostgreSQL.Port = port
		}
	}
	if val := os.Getenv("POSTGRES_USER"); val != "" {
		config.PostgreSQL.User = val
	}
	if val := os.Getenv("POSTGRES_PASSWORD"); val != "" {
		config.PostgreSQL.Password = val
	}
	if val := os.Getenv("POSTGRES_DB"); val != "" {
		config.PostgreSQL.Database = val
	}
	if val := os.Getenv("POSTGRES_SCHEMA"); val != "" {
		config.PostgreSQL.Schema = val
	}

	// Embedding
	if val := os.Getenv("EMBEDDING_MODEL"); val != "" {
		config.Embedding.Model = val
	}
	if val := os.Getenv("EMBEDDING_DIM"); val != "" {
		if dim, err := strconv.Atoi(val); err == nil {
			config.Embedding.Dimension = dim
		}
	}
	if val := os.Getenv("EMBEDDING_PREFIX_QUERY"); val != "" {
		config.Embedding.PrefixQuery = val
	}
	if val := os.Getenv("EMBEDDING_PREFIX_EMBEDDING"); val != "" {
		config.Embedding.PrefixEmbed = val
	}
	if val := os.Getenv("EMBEDDING_API_ENDPOINT"); val != "" {
		config.Embedding.APIEndpoint = val
	}

	// Paths
	if val := os.Getenv("SOURCE_DIR"); val != "" {
		config.Paths.SourceDir = val
	}
	if val := os.Getenv("PROCESSED_DIR"); val != "" {
		config.Paths.ProcessedDir = val
	}

	// Logging
	if val := os.Getenv("ENABLE_FILE_LOGGING"); val != "" {
		config.Logging.EnableFile = val == "true"
	}
	if val := os.Getenv("LOG_LEVEL"); val != "" {
		config.Logging.Level = val
	}
}

func (c *Config) Validate() error {
	if c.Project == "" {
		return fmt.Errorf("PROJECT が設定されていません")
	}

	if c.PostgreSQL.Host == "" {
		return fmt.Errorf("PostgreSQL ホストが設定されていません")
	}

	if c.PostgreSQL.User == "" {
		return fmt.Errorf("PostgreSQL ユーザーが設定されていません")
	}

	if c.PostgreSQL.Database == "" {
		return fmt.Errorf("PostgreSQL データベース名が設定されていません")
	}

	if c.Embedding.Model == "" {
		return fmt.Errorf("埋め込みモデルが設定されていません")
	}

	if c.Embedding.Dimension <= 0 {
		return fmt.Errorf("埋め込み次元数が正の値ではありません")
	}

	// ディレクトリの存在チェック
	if err := os.MkdirAll(c.Paths.SourceDir, 0755); err != nil {
		return fmt.Errorf("ソースディレクトリの作成に失敗: %w", err)
	}

	if err := os.MkdirAll(c.Paths.ProcessedDir, 0755); err != nil {
		return fmt.Errorf("処理済みディレクトリの作成に失敗: %w", err)
	}

	return nil
}

func (c *Config) PostgreSQLDSN() string {
	return fmt.Sprintf("host=%s port=%d user=%s password=%s dbname=%s sslmode=disable",
		c.PostgreSQL.Host, c.PostgreSQL.Port, c.PostgreSQL.User, c.PostgreSQL.Password, c.PostgreSQL.Database)
}

func DefaultConfigPath() string {
	return filepath.Join("config", "project.json")
}