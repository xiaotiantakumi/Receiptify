# Receiptify Makefile
# Quick start commands for development and deployment

.PHONY: help install build dev start start-minimal clean test lint check deploy install-blob start-blob build-blob stop-all install-azurite start-azurite stop-azurite demo-storage test-table demo-data

# Default target
help:
	@echo "Receiptify - 確定申告支援PWA Commands:"
	@echo ""
	@echo "Setup:"
	@echo "  make install      - Install all dependencies"
	@echo "  make install-blob - Install Blob Functions dependencies"
	@echo "  make install-azurite - Install Azurite and dependencies"
	@echo ""
	@echo "Development:"
	@echo "  make dev         - Start frontend development server"
	@echo "  make api         - Start API development server" 
	@echo "  make start       - Start all services (SWA + Blob Functions + Azurite)"
	@echo "  make start-minimal - Start minimal environment (SWA CLI + API only, no Docker)"
	@echo "  make start-blob  - Start Blob Functions development server"
	@echo "  make start-azurite - Start Azurite (local Azure Storage emulator)"
	@echo "  make stop-azurite  - Stop Azurite Docker container"
	@echo "  make stop-all    - Stop all services (SWA CLI, Blob Functions, Azurite)"
	@echo ""
	@echo "Build & Test:"
	@echo "  make build       - Build frontend and API"
	@echo "  make build-blob  - Build Blob Functions"
	@echo "  make lint        - Run linting checks"
	@echo "  make check       - Run type checking, linting, and frontend tests"
	@echo "  make test        - Run all tests (frontend, API, Blob Functions)"
	@echo ""
	@echo "Deployment:"
	@echo "  make deploy      - Deploy to Azure Static Web Apps"
	@echo ""
	@echo "Utilities:"
	@echo "  make clean       - Clean build artifacts"
	@echo "  make cleanup-all - Comprehensive cleanup of all services and containers"
	@echo ""
	@echo "Table Storage & Testing:"
	@echo "  make demo-storage - Start Azurite + create dummy data for Storage Explorer"
	@echo "  make demo-data    - Create dummy receipt data (requires Azurite running)"
	@echo "  make test-table   - Run Table Storage tests"
	@echo "  make test-real-receipts - Test real receipt uploads with AI analysis"
	@echo "  make test-upload-receipt RECEIPT=file.jpg - Upload single receipt file"
	@echo "  make check-git    - Check .gitignore configuration and git status"

# Install dependencies
install:
	@echo "📦 Installing frontend dependencies..."
	npm install
	@echo "📦 Installing API dependencies..."
	cd api && npm install
	@echo "📦 Installing Blob Functions dependencies..."
	cd functions-blob && npm install
	@echo "✅ Dependencies installed"

# Install Blob Functions dependencies only
install-blob:
	@echo "📦 Installing Blob Functions dependencies..."
	cd functions-blob && npm install
	@echo "✅ Blob Functions dependencies installed"

# Install Azurite and all dependencies
install-azurite: install
	@echo "🐳 Setting up Azurite with Docker..."
	@echo "📁 Creating Azurite data directory..."
	@mkdir -p azurite-data
	@echo "🔍 Checking Docker availability..."
	@docker --version > /dev/null 2>&1 || (echo "❌ Docker is required but not installed. Please install Docker first." && exit 1)
	@echo "📥 Pulling Azurite Docker image..."
	@docker pull mcr.microsoft.com/azure-storage/azurite:latest
	@echo "✅ Azurite setup complete"

# Development server
dev:
	@echo "🚀 Starting frontend development server..."
	npm run dev

# API development server
api:
	@echo "🚀 Starting API development server..."
	cd api && npm run start

# Port killing utility
kill-ports:
	@echo "🔪 Killing processes on development ports..."
	@lsof -ti:3000 | xargs kill -9 2>/dev/null || echo "  Port 3000 is clear"
	@lsof -ti:4280 | xargs kill -9 2>/dev/null || echo "  Port 4280 is clear"
	@lsof -ti:7071 | xargs kill -9 2>/dev/null || echo "  Port 7071 is clear"
	@lsof -ti:7072 | xargs kill -9 2>/dev/null || echo "  Port 7072 is clear"
	@lsof -ti:10000 | xargs kill -9 2>/dev/null || echo "  Port 10000 (Azurite Blob) is clear"
	@lsof -ti:10001 | xargs kill -9 2>/dev/null || echo "  Port 10001 (Azurite Queue) is clear"
	@lsof -ti:10002 | xargs kill -9 2>/dev/null || echo "  Port 10002 (Azurite Table) is clear"
	@echo "✅ Port cleanup complete"

# Comprehensive cleanup utility
cleanup-all:
	@echo "🧹 Comprehensive cleanup of all services..."
	@echo "  🔪 Killing processes on development ports..."
	@lsof -ti:3000 | xargs kill -9 2>/dev/null || echo "    Port 3000 is clear"
	@lsof -ti:4280 | xargs kill -9 2>/dev/null || echo "    Port 4280 is clear"
	@lsof -ti:7071 | xargs kill -9 2>/dev/null || echo "    Port 7071 is clear"
	@lsof -ti:7072 | xargs kill -9 2>/dev/null || echo "    Port 7072 is clear"
	@lsof -ti:10000 | xargs kill -9 2>/dev/null || echo "    Port 10000 (Azurite Blob) is clear"
	@lsof -ti:10001 | xargs kill -9 2>/dev/null || echo "    Port 10001 (Azurite Queue) is clear"
	@lsof -ti:10002 | xargs kill -9 2>/dev/null || echo "    Port 10002 (Azurite Table) is clear"
	@echo "  🐳 Stopping and removing all Azurite containers..."
	@docker ps -a --filter "name=azurite" --format "table {{.Names}}" | grep -v NAMES | xargs -r docker stop 2>/dev/null || echo "    No Azurite containers to stop"
	@docker ps -a --filter "name=azurite" --format "table {{.Names}}" | grep -v NAMES | xargs -r docker rm 2>/dev/null || echo "    No Azurite containers to remove"
	@echo "  🐳 Stopping receiptify-azurite container specifically..."
	@docker stop receiptify-azurite 2>/dev/null || echo "    receiptify-azurite container not running"
	@docker rm receiptify-azurite 2>/dev/null || echo "    receiptify-azurite container not found"
	@echo "  🐳 Stopping any containers using Azurite ports..."
	@docker ps -a --filter "publish=10000-10002" --format "table {{.Names}}" | grep -v NAMES | xargs -r docker stop 2>/dev/null || echo "    No containers using Azurite ports"
	@docker ps -a --filter "publish=10000-10002" --format "table {{.Names}}" | grep -v NAMES | xargs -r docker rm 2>/dev/null || echo "    No containers using Azurite ports to remove"
	@echo "✅ Comprehensive cleanup complete"

# Start integrated environment (SWA + Blob Functions + Azurite)
start: cleanup-all build
	@echo "🚀 Starting all services with extended wait times..."
	@echo "  ⏱️  Waiting 5 seconds after cleanup..."
	@sleep 5
	@echo "📁 Creating Azurite data directory..."
	@mkdir -p azurite-data
	@echo "🐳 Starting Azurite (local Azure Storage emulator) with Docker..."
	@echo "  🔍 Checking Docker daemon status..."
	@docker info > /dev/null 2>&1 || (echo "" && \
		echo "❌ Docker daemon not running. Please start Docker Desktop first." && \
		echo "" && \
		echo "💡 Alternative: Use 'make start-minimal' for development without Docker dependencies" && \
		echo "   This starts SWA CLI + API only (sufficient for authentication testing)" && \
		echo "" && \
		echo "📋 To fix this error:" && \
		echo "   1. Start Docker Desktop application" && \
		echo "   2. Wait for Docker to fully initialize" && \
		echo "   3. Run 'make start' again" && \
		echo "" && \
		exit 1)
	docker-compose up -d azurite
	@echo "  ⏱️  Waiting 10 seconds for Azurite to fully initialize..."
	@sleep 10
	@echo "  ✅ Verifying Azurite container is running..."
	@docker ps | grep receiptify-azurite > /dev/null || (echo "❌ Azurite failed to start" && exit 1)
	@echo "🔧 Setting up CORS for Azurite..."
	./set-azurite-cors.sh
	@echo "✅ CORS setup complete"
	@echo "🔧 Starting API server on port 7071..."
	cd api && npm run start &
	@echo "  ⏱️  Waiting 8 seconds for API server to start..."
	@sleep 8
	@echo "🔗 Starting Blob Functions on port 7072..."
	cd functions-blob && FUNCTIONS_CUSTOMHANDLER_PORT=7072 npm run start &
	@echo "  ⏱️  Waiting 5 seconds for Blob Functions to start..."
	@sleep 5
	@echo "🌐 Starting SWA CLI..."
	npm run swa:all

# Start minimal environment (SWA CLI + API only, no Docker)
start-minimal: kill-ports
	@echo "🚀 Starting minimal environment (SWA CLI + API only)..."
	@echo "  ⏱️  Waiting 3 seconds after port cleanup..."
	@sleep 3
	@echo "🔧 Starting API server on port 7071..."
	cd api && npm run start &
	@echo "  ⏱️  Waiting 5 seconds for API server to start..."
	@sleep 5
	@echo "🌐 Starting SWA CLI..."
	npm run swa:all

# Start Blob Functions development server
start-blob:
	@echo "🚀 Starting Blob Functions development server..."
	cd functions-blob && npm run start

# Start Azurite (local Azure Storage emulator)
start-azurite:
	@echo "🚀 Starting Azurite (local Azure Storage emulator) with Docker..."
	@echo "  Blob Storage: http://127.0.0.1:10000"
	@echo "  Table Storage: http://127.0.0.1:10002"
	@echo "  Queue Storage: http://127.0.0.1:10001"
	@mkdir -p azurite-data
	docker-compose up -d azurite
	@echo "  ⏱️  Waiting for Azurite to initialize..."
	@sleep 5 # コンテナ起動後に `docker ps` で存在確認を行うため、ここの待ち時間は短く設定
	@echo "  ✅ Verifying Azurite container is running..."
	@docker ps | grep receiptify-azurite > /dev/null || (echo "❌ Azurite failed to start" && exit 1)
	@echo "🔧 Setting up CORS for Azurite..."
	./set-azurite-cors.sh
	@echo "✅ CORS setup complete"

# Stop Azurite Docker container
stop-azurite:
	@echo "🛑 Stopping Azurite Docker container..."
	docker-compose stop azurite
	@echo "✅ Azurite stopped"

# Stop all services (SWA CLI, Blob Functions, Azurite)
stop-all:
	@echo "🛑 Stopping all services..."
	@echo "  🔪 Killing development server processes..."
	@lsof -ti:3000 | xargs kill -9 2>/dev/null || echo "    Port 3000 is clear"
	@lsof -ti:4280 | xargs kill -9 2>/dev/null || echo "    Port 4280 (SWA CLI) is clear"
	@lsof -ti:7071 | xargs kill -9 2>/dev/null || echo "    Port 7071 is clear"
	@lsof -ti:7072 | xargs kill -9 2>/dev/null || echo "    Port 7072 (Blob Functions) is clear"
	@echo "  🐳 Stopping Docker containers..."
	@docker-compose stop azurite 2>/dev/null || echo "    Azurite was not running"
	@echo "  🐳 Stopping all Azurite containers..."
	@docker ps -a --filter "name=azurite" --format "table {{.Names}}" | grep -v NAMES | xargs -r docker stop 2>/dev/null || echo "    No Azurite containers to stop"
	@docker ps -a --filter "name=azurite" --format "table {{.Names}}" | grep -v NAMES | xargs -r docker rm 2>/dev/null || echo "    No Azurite containers to remove"
	@echo "  🐳 Stopping containers using Azurite ports..."
	@docker ps -a --filter "publish=10000-10002" --format "table {{.Names}}" | grep -v NAMES | xargs -r docker stop 2>/dev/null || echo "    No containers using Azurite ports"
	@docker ps -a --filter "publish=10000-10002" --format "table {{.Names}}" | grep -v NAMES | xargs -r docker rm 2>/dev/null || echo "    No containers using Azurite ports to remove"
	@echo "✅ All services stopped"


# Build everything
build:
	@echo "🏗️  Building frontend..."
	npm run build
	@echo "🏗️  Building API..."
	cd api && npm run build
	@echo "🏗️  Building Blob Functions..."
	cd functions-blob && npm run build
	@echo "✅ Build complete"

# Build Blob Functions only
build-blob:
	@echo "🏗️  Building Blob Functions..."
	cd functions-blob && npm run build
	@echo "✅ Blob Functions build complete"

# Linting
lint:
	@echo "🔍 Running ESLint checks..."
	npm run lint
	@echo "✅ Linting complete"

# Type checking and linting
check:
	@echo "🔍 Running type checking..."
	npx tsc --noEmit
	@echo "🔍 Running API type checking..."
	cd api && npx tsc --noEmit
	@echo "🔍 Running Blob Functions type checking..."
	cd functions-blob && npx tsc --noEmit
	@echo "🔍 Running linting..."
	npm run lint
	@echo "🧪 Running frontend tests..."
	npm run test:ci
	@echo "✅ All checks complete"

# Run all tests
test:
	@echo "🧪 Running all tests..."
	@echo "📁 Testing frontend components..."
	npm run test:ci
	@echo "📁 Testing API functions..."
	cd api && npm test
	@echo "📁 Testing Blob functions..."
	cd functions-blob && npm test
	@echo "✅ All tests completed"

# Run tests with coverage
test-coverage:
	@echo "🧪 Running tests with coverage..."
	@echo "📁 Testing API functions with coverage..."
	cd api && npm run test:coverage
	@echo "📁 Testing Blob functions with coverage..."
	cd functions-blob && npm run test:coverage
	@echo "✅ Coverage reports generated"

# Run only API tests
test-api:
	@echo "🧪 Running API tests..."
	cd api && npm test

# Run only Blob functions tests
test-blob:
	@echo "🧪 Running Blob functions tests..."
	cd functions-blob && npm test

# Run only frontend tests
test-frontend:
	@echo "🧪 Running frontend tests..."
	npm run test:ci

# Deploy to Azure Static Web Apps
deploy: build
	@echo "🚀 Deploying to Azure Static Web Apps..."
	@echo "⚠️  Make sure you have swa CLI installed: npm install -g @azure/static-web-apps-cli"
	@echo "⚠️  Make sure you're logged in: swa login"
	@echo "🔄 Starting deployment..."
	swa deploy ./out --api-location ./api

# Clean build artifacts
clean:
	@echo "🧹 Cleaning build artifacts..."
	rm -rf out/
	rm -rf api/dist/
	rm -rf functions-blob/dist/
	rm -rf .next/
	rm -rf node_modules/.cache/
	@echo "🐳 Stopping and removing Azurite Docker containers..."
	@docker-compose down --volumes --remove-orphans 2>/dev/null || echo "  No Docker containers to clean"
	rm -rf azurite-data/
	rm -f azurite-debug.log
	@echo "✅ Clean complete"

# Demo: Storage Explorer with dummy data
demo-storage:
	@echo "🏪 Starting Azurite + Creating dummy data for Azure Storage Explorer..."
	@echo "📋 This will start Azurite and populate it with sample receipt data"
	@echo ""
	npm run demo:storage-explorer
	@echo ""
	@echo "🎯 Azure Storage Explorer Connection:"
	@echo "  Connection String: DefaultEndpointsProtocol=http;AccountName=devstoreaccount1;AccountKey=Eby8vdM02xNOcqFlqUwJPLlmEtlCDXJ1OUzFT50uSRZ6IFsuFq2UVErCz4I6tq/K1SZFPTOtr/KBHBeksoGMGw==;TableEndpoint=http://127.0.0.1:10002/devstoreaccount1;"
	@echo "  Table Name: receiptresults"
	@echo ""
	@echo "📱 Setup Instructions:"
	@echo "  1. Open Azure Storage Explorer"
	@echo "  2. Connect with the connection string above"
	@echo "  3. Navigate to Tables > receiptresults"
	@echo ""

# Create dummy data only (requires Azurite to be running)
demo-data:
	@echo "📊 Creating dummy receipt data..."
	npm run create-dummy-data

# Run Table Storage tests
test-table:
	@echo "🧪 Running Table Storage tests..."
	npm run test:table-storage

# Test real receipt uploads and AI analysis
test-real-receipts:
	@echo "🧪 Testing real receipt uploads and AI analysis..."
	@echo "📋 This will test all receipt files in test/sample-receipts/"
	@echo "⚠️  Ensure the following are running:"
	@echo "   - Azurite (make start-azurite)"
	@echo "   - Blob Functions (make start-blob)"
	@echo "   - GEMINI_API_KEY is configured"
	@echo ""
	npm run test:real-receipts

# Upload and test a single receipt file
test-upload-receipt:
	@echo "🧪 Upload and test a single receipt file..."
	@echo "📖 Usage: make test-upload-receipt RECEIPT=filename.jpg"
	@echo "📂 Place receipt files in test/sample-receipts/"
	@echo ""
	@if [ -z "$(RECEIPT)" ]; then \
		echo "❌ Please specify RECEIPT parameter"; \
		echo "   Example: make test-upload-receipt RECEIPT=receipt_20241201_コンビニ_1580.jpg"; \
		exit 1; \
	fi
	npm run test:upload-receipt $(RECEIPT)

# Check .gitignore configuration
check-git:
	@echo "🔍 Checking .gitignore configuration..."
	npm run check:gitignore