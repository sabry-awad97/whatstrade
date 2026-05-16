.PHONY: help build run dev test sqlc clean docker-build docker-run

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-15s\033[0m %s\n", $$1, $$2}'

build: ## Build the binary
	go build -o bin/whatsapp-service ./cmd/server

run: ## Run the service
	go run ./cmd/server/main.go

dev: ## Run with hot reload (requires air: go install github.com/cosmtrek/air@latest)
	air

test: ## Run tests
	go test -v -race -coverprofile=coverage.out ./...

test-coverage: test ## Run tests with coverage report
	go tool cover -html=coverage.out

sqlc: ## Generate sqlc code
	sqlc generate -f ./internal/adapter/repository/sqlc.yaml

lint: ## Run linter (requires golangci-lint)
	golangci-lint run

clean: ## Clean build artifacts
	rm -rf bin/
	rm -f coverage.out

docker-build: ## Build Docker image
	docker build -t whatsapp-service:latest .

docker-run: ## Run Docker container
	docker run -p 8080:8080 --env-file .env whatsapp-service:latest

deps: ## Download dependencies
	go mod download
	go mod tidy

sqlc-install: ## Install sqlc CLI
	go install github.com/sqlc-dev/sqlc/cmd/sqlc@latest

air-install: ## Install air for hot reload
	go install github.com/cosmtrek/air@latest

tools: sqlc-install air-install ## Install development tools
