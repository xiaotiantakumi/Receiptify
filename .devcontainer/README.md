# PWA Starter Template DevContainer

This DevContainer is configured for developing the PWA Starter Template with all necessary tools pre-installed.

## Apple Silicon (M1/M2) Compatibility

This DevContainer is optimized for Apple Silicon Macs by using `--platform=linux/amd64` to ensure Azure Functions Core Tools compatibility. The container runs in x86_64 emulation mode via Rosetta 2.

## Included Tools

- **Node.js 20** - JavaScript runtime (x86_64)
- **Azure Static Web Apps CLI** - For local development and deployment
- **Azure Functions Core Tools v4** - For serverless API development (x86_64)
- **Claude Code** - AI-powered development assistant
- **Git Delta** - Enhanced git diff viewer
- **ZSH with Oh My Zsh** - Enhanced shell experience

## VS Code Extensions

- **ESLint** - JavaScript/TypeScript linting
- **Prettier** - Code formatting
- **TypeScript** - Enhanced TypeScript support
- **Tailwind CSS** - CSS utility classes support
- **Azure Account** - Azure integration
- **Azure Functions** - Azure Functions development

## Known Issues & Workarounds

### Azure Functions Core Tools on Apple Silicon

Due to limited ARM64 support in Azure Functions Core Tools v4, this DevContainer uses x86_64 emulation:

1. **Performance**: May be slower than native ARM64
2. **Memory Usage**: Higher due to emulation overhead
3. **First Run**: Functions Core Tools download may take time

### Alternative Development Options

If you experience performance issues, consider:

1. **Frontend-only development**:
   ```bash
   npm run dev  # Runs Next.js on port 3000
   ```

2. **Mock API responses** in frontend code during development

3. **Deploy to Azure** for full API testing

## Getting Started

1. Open this project in VS Code
2. When prompted, reopen in DevContainer
3. Wait for the container to build (may take 5-10 minutes on first run)
4. Dependencies will auto-install via `postCreateCommand`

## Development Commands

- `make install` - Install dependencies
- `make dev` - Start frontend development server (port 3000)
- `make start` - Start integrated SWA environment (port 4280)
- `make build` - Build the project

## Troubleshooting

### Functions Core Tools Issues
If Azure Functions Core Tools fails to start:
1. Try rebuilding the container: **Ctrl+Shift+P** → "Dev Containers: Rebuild Container"
2. Use frontend-only development: `make dev`
3. Deploy to Azure for full testing

### Docker Platform Issues
Ensure Docker Desktop has "Use Rosetta for x86/amd64 emulation on Apple Silicon" enabled in Settings > Features in development.

## Environment Variables

The container includes:
- `NODE_OPTIONS="--max-old-space-size=4096"` - Increased memory for Node.js
- `DEVCONTAINER=true` - Indicates running in DevContainer

## Ports

- `3000` - Next.js development server
- `4280` - Azure Static Web Apps CLI
- `7071` - Azure Functions runtime

## File Persistence

- Bash history is persisted across container rebuilds
- Claude Code configuration is persisted in a named volume
- npm cache is optimized for faster installs