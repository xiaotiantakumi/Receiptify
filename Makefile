# Receiptify Makefile
# Quick start commands for development and deployment

.PHONY: help install build dev start clean test lint check deploy install-blob start-blob build-blob start-all install-azurite start-azurite stop-azurite

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
	@echo "  make start       - Start integrated environment (SWA CLI)"
	@echo "  make start-blob  - Start Blob Functions development server"
	@echo "  make start-azurite - Start Azurite (local Azure Storage emulator)"
	@echo "  make stop-azurite  - Stop Azurite Docker container"
	@echo "  make start-all   - Start all services (SWA + Blob Functions + Azurite)"
	@echo ""
	@echo "Build & Test:"
	@echo "  make build       - Build frontend and API"
	@echo "  make build-blob  - Build Blob Functions"
	@echo "  make lint        - Run linting checks"
	@echo "  make check       - Run type checking and linting"
	@echo "  make test        - Run tests (when implemented)"
	@echo ""
	@echo "Deployment:"
	@echo "  make deploy      - Deploy to Azure Static Web Apps"
	@echo ""
	@echo "Utilities:"
	@echo "  make clean       - Clean build artifacts"

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

# Start integrated environment
start: kill-ports
	@echo "🚀 Starting integrated environment (SWA CLI)..."
	@echo "  ⏱️  Waiting 3 seconds after port cleanup..."
	@sleep 3
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

# Stop Azurite Docker container
stop-azurite:
	@echo "🛑 Stopping Azurite Docker container..."
	docker-compose stop azurite
	@echo "✅ Azurite stopped"

# Start all services (SWA + Blob Functions + Azurite)
start-all: kill-ports
	@echo "🚀 Starting all services..."
	@echo "  ⏱️  Waiting 3 seconds after port cleanup..."
	@sleep 3
	@echo "📁 Creating Azurite data directory..."
	@mkdir -p azurite-data
	@echo "🐳 Starting Azurite (local Azure Storage emulator) with Docker..."
	docker-compose up -d azurite
	@sleep 3
	@echo "Starting Blob Functions on port 7072..."
	cd functions-blob && FUNCTIONS_CUSTOMHANDLER_PORT=7072 npm run start &
	@sleep 2
	@echo "Starting SWA CLI..."
	npm run swa:all

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
	@echo "✅ All checks complete"

# Test (placeholder for future tests)
test:
	@echo "🧪 Running tests..."
	@echo "⚠️  Tests not yet implemented"
	@echo "  To add tests, install Jest and React Testing Library"
	@echo "  Then add test scripts to package.json"

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