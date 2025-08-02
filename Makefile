# Receiptify Makefile
# Quick start commands for development and deployment

.PHONY: help install build dev start clean test lint check deploy

# Default target
help:
	@echo "Receiptify - 確定申告支援PWA Commands:"
	@echo ""
	@echo "Setup:"
	@echo "  make install     - Install all dependencies"
	@echo ""
	@echo "Development:"
	@echo "  make dev         - Start frontend development server"
	@echo "  make api         - Start API development server" 
	@echo "  make start       - Start integrated environment (SWA CLI)"
	@echo ""
	@echo "Build & Test:"
	@echo "  make build       - Build frontend and API"
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
	@echo "✅ Dependencies installed"

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
	@echo "✅ Port cleanup complete"

# Start integrated environment
start: kill-ports
	@echo "🚀 Starting integrated environment (SWA CLI)..."
	@echo "  ⏱️  Waiting 3 seconds after port cleanup..."
	@sleep 3
	npm run swa:all

# Build everything
build:
	@echo "🏗️  Building frontend..."
	npm run build
	@echo "🏗️  Building API..."
	cd api && npm run build
	@echo "✅ Build complete"

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
	rm -rf .next/
	rm -rf node_modules/.cache/
	@echo "✅ Clean complete"