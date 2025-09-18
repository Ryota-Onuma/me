package config

import (
	"os"
	"path/filepath"
	"testing"
)

func TestLoadConfig(t *testing.T) {
	// テスト用の設定ファイルを作成
	tempDir := t.TempDir()
	configPath := filepath.Join(tempDir, "test_config.json")

	configJSON := `{
		"project": "test-project",
		"postgres": {
			"host": "localhost",
			"port": 5432,
			"user": "testuser",
			"password": "testpass",
			"db": "testdb"
		},
		"embedding": {
			"model": "test-model",
			"dim": 512
		}
	}`

	if err := os.WriteFile(configPath, []byte(configJSON), 0644); err != nil {
		t.Fatalf("テスト設定ファイルの作成に失敗: %v", err)
	}

	config, err := LoadConfig(configPath, "test-project")
	if err != nil {
		t.Fatalf("設定の読み込みに失敗: %v", err)
	}

	// プロジェクト名のテスト
	if config.Project != "test-project" {
		t.Errorf("プロジェクト名が一致しません: 期待=%s, 実際=%s", "test-project", config.Project)
	}

	// PostgreSQL設定のテスト
	if config.PostgreSQL.Host != "localhost" {
		t.Errorf("PostgreSQLホストが一致しません: 期待=%s, 実際=%s", "localhost", config.PostgreSQL.Host)
	}

	if config.PostgreSQL.Port != 5432 {
		t.Errorf("PostgreSQLポートが一致しません: 期待=%d, 実際=%d", 5432, config.PostgreSQL.Port)
	}

	// 埋め込み設定のテスト
	if config.Embedding.Model != "test-model" {
		t.Errorf("埋め込みモデルが一致しません: 期待=%s, 実際=%s", "test-model", config.Embedding.Model)
	}

	if config.Embedding.Dimension != 512 {
		t.Errorf("埋め込み次元が一致しません: 期待=%d, 実際=%d", 512, config.Embedding.Dimension)
	}
}

func TestLoadConfigWithEnvironmentOverride(t *testing.T) {
	// テスト用の設定ファイルを作成
	tempDir := t.TempDir()
	configPath := filepath.Join(tempDir, "test_config.json")

	configJSON := `{
		"project": "test-project",
		"postgres": {
			"host": "localhost",
			"port": 5432
		}
	}`

	if err := os.WriteFile(configPath, []byte(configJSON), 0644); err != nil {
		t.Fatalf("テスト設定ファイルの作成に失敗: %v", err)
	}

	// 環境変数を設定
	os.Setenv("POSTGRES_HOST", "override-host")
	os.Setenv("POSTGRES_PORT", "3306")
	defer func() {
		os.Unsetenv("POSTGRES_HOST")
		os.Unsetenv("POSTGRES_PORT")
	}()

	config, err := LoadConfig(configPath, "test-project")
	if err != nil {
		t.Fatalf("設定の読み込みに失敗: %v", err)
	}

	// 環境変数による上書きが適用されているかテスト
	if config.PostgreSQL.Host != "override-host" {
		t.Errorf("環境変数による上書きが適用されていません: 期待=%s, 実際=%s", "override-host", config.PostgreSQL.Host)
	}

	if config.PostgreSQL.Port != 3306 {
		t.Errorf("環境変数による上書きが適用されていません: 期待=%d, 実際=%d", 3306, config.PostgreSQL.Port)
	}
}

func TestConfigValidation(t *testing.T) {
	tests := []struct {
		name      string
		config    *Config
		expectErr bool
	}{
		{
			name: "有効な設定",
			config: &Config{
				Project: "test-project",
				PostgreSQL: PostgreSQLConfig{
					Host:     "localhost",
					User:     "user",
					Database: "db",
				},
				Embedding: EmbeddingConfig{
					Model:     "model",
					Dimension: 512,
				},
				Paths: PathsConfig{
					SourceDir:    "data/source",
					ProcessedDir: "data/processed",
				},
			},
			expectErr: false,
		},
		{
			name: "プロジェクト名が空",
			config: &Config{
				Project: "",
				PostgreSQL: PostgreSQLConfig{
					Host:     "localhost",
					User:     "user",
					Database: "db",
				},
				Embedding: EmbeddingConfig{
					Model:     "model",
					Dimension: 512,
				},
			},
			expectErr: true,
		},
		{
			name: "PostgreSQLホストが空",
			config: &Config{
				Project: "test-project",
				PostgreSQL: PostgreSQLConfig{
					Host:     "",
					User:     "user",
					Database: "db",
				},
				Embedding: EmbeddingConfig{
					Model:     "model",
					Dimension: 512,
				},
			},
			expectErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := tt.config.Validate()
			if tt.expectErr && err == nil {
				t.Error("エラーが期待されましたが、発生しませんでした")
			}
			if !tt.expectErr && err != nil {
				t.Errorf("エラーが期待されませんでしたが、発生しました: %v", err)
			}
		})
	}
}

func TestPostgreSQLDSN(t *testing.T) {
	config := &Config{
		PostgreSQL: PostgreSQLConfig{
			Host:     "localhost",
			Port:     5432,
			User:     "testuser",
			Password: "testpass",
			Database: "testdb",
		},
	}

	expected := "host=localhost port=5432 user=testuser password=testpass dbname=testdb sslmode=disable"
	actual := config.PostgreSQLDSN()

	if actual != expected {
		t.Errorf("DSNが一致しません:\n期待=%s\n実際=%s", expected, actual)
	}
}