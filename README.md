# PWA Starter Template

A modern Progressive Web App (PWA) starter template built with Next.js and Azure Functions. Get started quickly with a production-ready setup including PWA features, serverless API, and Azure deployment configuration.

## Features

- ⚡ **Next.js 14** with App Router and TypeScript
- ☁️ **Azure Functions** for serverless API
- 📱 **PWA Support** with offline capabilities
- 🎨 **Tailwind CSS** for styling
- 🌙 **Dark Mode** support
- 🚀 **Azure Static Web Apps** ready

## Getting Started

### Prerequisites

- Node.js 18.17.1 or higher
- npm or yarn
- Azure Functions Core Tools (optional, for local API development)

### Installation

1. Use this template or clone this repository:
```bash
# Option 1: Use as GitHub template (recommended)
# Click "Use this template" button on GitHub

# Option 2: Clone directly
git clone https://github.com/your-username/pwa-starter.git
cd pwa-starter
```

2. Install dependencies:
```bash
make install
# or manually:
npm install && cd api && npm install && cd ..
```

### Development

Start the development environment with integrated API:
```bash
make start
# or
npm run swa:all
```

This will start:
- Frontend at http://localhost:4280
- API at http://localhost:4280/api/hello

For frontend-only development:
```bash
make dev
# or
npm run dev
```

### Building

Build the entire project:
```bash
make build
# or
npm run build && npm run build:api
```

## Project Structure

```
.
├── app/                    # Next.js app directory
│   ├── page.tsx           # Main page with Hello World demo
│   ├── components/        # React components
│   ├── globals.css        # Global styles
│   └── layout.tsx         # Root layout
├── api/                    # Azure Functions API
│   └── src/
│       └── functions/
│           └── hello.ts   # Hello World API endpoint
├── public/                 # Static assets & PWA files
│   ├── manifest.json      # PWA manifest
│   └── offline.html       # Offline fallback page
├── next.config.mjs        # Next.js configuration
├── staticwebapp.config.json # Azure Static Web Apps config
└── Makefile               # Development commands
```

## Customization

### Adding New API Endpoints

1. Create a new file in `api/src/functions/`
2. Use the Azure Functions v4 programming model
3. Export your function with HTTP trigger configuration

Example:
```typescript
import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";

export async function myFunction(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    // Your function logic here
}

app.http('myFunction', {
    methods: ['GET', 'POST'],
    authLevel: 'anonymous',
    handler: myFunction
});
```

### Updating the Frontend

- Modify `app/page.tsx` for the main content
- Add new components in `app/components/`
- Update styles in `tailwind.config.ts`

### PWA Configuration

- Update `public/manifest.json` with your app details
- Replace icons in `public/` directory
- Modify `public/offline.html` for offline experience

## Deployment

### Azure Static Web Apps

1. Push your code to GitHub
2. Create a new Azure Static Web App
3. Connect it to your GitHub repository
4. Azure will automatically build and deploy

### Environment Variables

Create a `.env.local` file for local development:
```bash
# Add your environment variables here
# NEXT_PUBLIC_API_URL=http://localhost:4280/api
```

## Available Scripts

- `npm run dev` - Start frontend development server
- `npm run build` - Build frontend for production
- `npm run swa:all` - Start integrated environment
- `npm run lint` - Run ESLint
- `npm run build:api` - Build API functions

## What's Included

This template provides:

- 🏗️ **Complete project structure** with frontend and API
- 📋 **Example components** including theme toggle and header
- 🔧 **Development tools** with hot reload and integrated testing
- 📱 **PWA features** ready to customize for your app
- ☁️ **Deployment configuration** for Azure Static Web Apps
- 📝 **Documentation** and development guidelines

## Next Steps

After setting up this template:

1. **Customize the PWA manifest** in `public/manifest.json`
2. **Replace default icons** in the `public/` directory
3. **Update the theme and styling** in `tailwind.config.ts`
4. **Add your API endpoints** in `api/src/functions/`
5. **Modify the main page** in `app/page.tsx`
6. **Configure deployment** for your Azure subscription

## License

MIT