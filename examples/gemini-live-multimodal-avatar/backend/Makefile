.PHONY: all build test run clean fmt tidy

# Binary name
APP_NAME=live-api-rewrite-backend

# Default target
all: test build

# Build the application
build:
	@echo "Building $(APP_NAME)..."
	@go build -o bin/$(APP_NAME) ./cmd/server

# Run the application
run:
	@echo "Running $(APP_NAME)..."
	@go run ./cmd/server

# Run tests
test:
	@echo "Running static analysis..."
	@go vet ./...
	@echo "Running tests..."
	@go test -v ./...

# Format code
fmt:
	@echo "Formatting code..."
	@go fmt ./...

# Tidy dependencies
tidy:
	@echo "Tidying module dependencies..."
	@go mod tidy

# Clean build artifacts
clean:
	@echo "Cleaning..."
	@rm -rf bin/
