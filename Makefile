# PWA Starter Template Makefile
# Quick start commands for development

.PHONY: help install build dev start clean

# Default target
help:
	@echo "PWA Starter Template Commands:"
	@echo ""
	@echo "Setup:"
	@echo "  make install     - Install all dependencies"
	@echo ""
	@echo "Development:"
	@echo "  make dev         - Start frontend development server"
	@echo "  make start       - Start integrated environment (SWA CLI)"
	@echo ""
	@echo "Build:"
	@echo "  make build       - Build everything"
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

# Clean build artifacts
clean:
	@echo "🧹 Cleaning build artifacts..."
	rm -rf out/
	rm -rf api/dist/
	rm -rf .next/
	@echo "✅ Clean complete"