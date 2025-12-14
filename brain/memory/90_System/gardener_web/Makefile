.PHONY: run build clean kill init test

PORT := 56789
MEMORY_ROOT := $(shell dirname $(shell dirname $(shell pwd)))
PERSONAL_DIR := $(MEMORY_ROOT)/personal

# デフォルト: ポートをkillしてから起動
run: kill
	@echo "🌱 Starting Gardener Web..."
	go run main.go

# ビルドして起動
build: kill
	go build -o gardener_web main.go
	./gardener_web

# ポート上のプロセスを強制終了
kill:
	@echo "🔪 Killing process on port $(PORT)..."
	@lsof -ti:$(PORT) | xargs kill -9 2>/dev/null || true

# ビルド成果物を削除
clean:
	rm -f gardener_web coverage.out

# テスト実行
test:
	go test -v -cover

# 初期化: personalプロジェクトを作成
init:
	@echo "🌱 Initializing Gardener Web..."
	@mkdir -p $(PERSONAL_DIR)/00-Literature-Notes
	@mkdir -p $(PERSONAL_DIR)/01-Fleeting-Notes/Secret
	@mkdir -p $(PERSONAL_DIR)/02-Permanent-Notes/Secret
	@mkdir -p $(PERSONAL_DIR)/03-Structured-Notes
	@mkdir -p $(PERSONAL_DIR)/91_Metadata
	@echo '{"tags":[],"notes":[],"lastUpdated":""}' > $(PERSONAL_DIR)/91_Metadata/metadata.json
	@echo '{"projects":[{"id":"personal","name":"Personal","rootPath":"$(PERSONAL_DIR)"}],"activeProject":"personal"}' > projects.json
	@echo "✅ Created personal project at $(PERSONAL_DIR)"
	@echo "📂 projects.json updated"
