.PHONY: help build clean db-up run-server index search

PROJECT ?= mcp-rag-server-go

help:
	@echo 'Usage: make <target>'
	@echo 'Targets:'
	@echo '  build      Build binaries'
	@echo '  clean      Clean build artifacts'
	@echo '  db-up      Start PostgreSQL'
	@echo '  run-server Run MCP server'
	@echo '  index      Index documents'
	@echo '  search     Search documents (QUERY="...")'

build:
	@mkdir -p bin
	go build -o bin/server ./cmd/server
	go build -o bin/cli ./cmd/cli

clean:
	rm -rf bin coverage.out coverage.html

test:
	go test -v ./...

db-up:
	docker-compose up -d postgres

db-down:
	docker-compose down

db-logs:
	docker-compose logs -f postgres

run-server: build
	./bin/server -project $(PROJECT)

index: build
	./bin/cli -project $(PROJECT) index

count: build
	./bin/cli -project $(PROJECT) count

clear: build
	./bin/cli -project $(PROJECT) clear

search: build
	@if [ -z "$(QUERY)" ]; then \
		echo "Usage: make search QUERY=\"your query\""; \
	else \
		./bin/cli -project $(PROJECT) search "$(QUERY)"; \
	fi

dev: db-up run-server

.DEFAULT_GOAL := help