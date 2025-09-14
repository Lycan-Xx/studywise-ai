# StudyWise AI - Intelligent Test Generator

A modern full-stack application that uses multi-provider AI to generate personalized tests and study materials from any text content, with advanced analytics and learning insights.

## Project Structure

```
studywise-ai/
├── client/                 # React frontend application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── stores/        # Zustand state management
│   │   ├── contexts/      # React contexts
│   │   ├── hooks/         # Custom React hooks
│   │   ├── lib/           # Utilities and configurations
│   │   ├── types/         # TypeScript type definitions
│   │   ├── utils/         # Helper functions
│   │   └── services/      # API service functions
│   ├── public/
│   └── index.html
├── server/                 # Node.js/Express backend
│   ├── controllers/        # Route handlers
│   ├── services/          # Business logic (AI, database)
│   ├── lib/               # Database and utility functions
│   ├── routes.ts          # API route definitions
│   ├── index.ts           # Server entry point
│   ├── config.ts          # Server configuration
│   └── storage.ts         # Legacy storage (deprecated)
├── shared/                 # Shared types and utilities
├── config/                 # Configuration files
│   ├── vite.config.ts     # Frontend build configuration
│   ├── tsconfig.json      # TypeScript configuration
│   └── tailwind.config.ts # Styling configuration
├── scripts/                # Build and deployment scripts
├── docs/                   # Documentation
├── supabase/               # Database migrations and config
└── src/                   # Legacy source directory (deprecated)
```

## Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd studywise-ai
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your API keys
   ```

4. **Start development servers individually**
   ```bash
   # Terminal 1: Start the backend server
   npm run dev:server

   # Terminal 2: Start the frontend client
   npm run dev:client
   ```

5. **Open your browser**
   - Frontend: http://localhost:8080 (or next available port)
   - Backend API: http://localhost:5000

6. **Configure API endpoint**
   - For local development: `VITE_API_URL=http://localhost:5000` in `.env`
   - For production: `VITE_API_URL=https://yourb-backend-API.com` in `.env`

## Available Scripts

### Development
```bash
npm run dev:client       # Start only frontend (Vite dev server)
npm run dev:server       # Start only backend (Express server)
```

### Building
```bash
npm run build            # Build both client and server
npm run build:client     # Build only frontend
npm run build:server     # Build only backend
```

### Production
```bash
npm run start:prod       # Start production server
npm run preview          # Preview built client
```

### Testing & Deployment
```bash
npm run test:deployment  # Test deployment readiness
```

## Configuration

### Environment Variables

Create a `.env` file in the project root:

```env
# AI Configuration
GEMINI_API_KEY=your_gemini_api_key
VITE_GEMINI_API_KEY=your_gemini_api_key
OPENROUTER_API_KEY=your_openrouter_api_key
VITE_OPENROUTER_API_KEY=your_openrouter_api_key

# Database & Auth
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
GOOGLE_OAUTH_CLIENT_ID=your_google_oauth_client_id
GOOGLE_OAUTH_CLIENT_SECRET=your_google_oauth_client_secret

# API Configuration
VITE_API_URL=https://your-deployed-backend.com

# Server
NODE_ENV=development
PORT=5000
```

### API Endpoints

- `POST /api/tests/generate` - Generate questions from content
- `POST /api/tests/flashcards` - Generate flashcards
- `POST /api/tests/:testId/results` - Save test results with user answers
- `POST /api/tests/:testId/insights` - Generate AI-powered performance insights
- `GET /api/library` - Retrieve user's saved tests and materials
- `GET /health` - Health check endpoint

## Architecture

### Frontend (Client)
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS + shadcn/ui
- **State Management**: Zustand
- **Routing**: Wouter
- **API Client**: Custom hooks with React Query

### Backend (Server)
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **AI Integration**: Multi-provider AI system (Google Gemini, OpenRouter, Claude, GPT)
- **Authentication**: Supabase Auth with OAuth support
- **Database**: Supabase (PostgreSQL) with Row-Level Security
- **Deployment**: Render with automatic scaling
- **Caching**: In-memory caching for AI responses
- **Rate Limiting**: Intelligent throttling across AI providers

### Key Features
- Multi-Provider AI System: Intelligent failover between Gemini, GPT, Claude, and other models
- Advanced Document Processing: Support for PDF, DOCX, TXT, and Markdown files
- Source-Linked Questions: Every question traces back to its origin in the source material
- AI-Powered Insights: Automated performance analysis and study recommendations
- Comprehensive Analytics: Detailed progress tracking and learning patterns
- Mobile-First Design: Fully responsive interface optimized for all devices
- Real-Time Test Taking: Live progress tracking with auto-save functionality
- Secure Authentication: Supabase Auth with OAuth support

## Deployment

### Backend (Render)
1. Connect your GitHub repository to Render
2. Create a Blueprint deployment using `render.yaml`
3. Configure environment secrets
4. Deploy automatically

### Frontend (Netlify/Vercel)
1. Build the client: `npm run build:client`
2. Deploy `dist/public/` directory
3. Configure environment variables:
   - `VITE_API_URL` - Backend API URL
   - `VITE_SUPABASE_URL` - Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key

See `docs/RENDER_DEPLOYMENT.md` for detailed instructions.

## Testing

### Pre-deployment Testing
```bash
npm run test:deployment
```

This script validates:
- Environment variables configuration
- Project file structure integrity
- Server startup and health checks
- API endpoint connectivity
- Build process validation

## Directory Guide

### `/client` - Frontend Application
- `src/components/` - Reusable UI components and overlays
- `src/pages/` - Page components (dashboard, landing, settings, etc.)
- `src/stores/` - Zustand state management stores
- `src/contexts/` - React context providers (auth, etc.)
- `src/hooks/` - Custom React hooks
- `src/lib/` - Utilities, API clients, and configurations
- `src/types/` - TypeScript type definitions
- `src/utils/` - Helper functions and utilities
- `src/services/` - API service functions
- `src/auth/` - Authentication components

### `/server` - Backend Application
- `controllers/` - Route handlers and business logic
- `services/` - AI services and external integrations
- `lib/` - Database services and utilities
- `routes.ts` - API route definitions
- `index.ts` - Server entry point
- `config.ts` - Server configuration and environment setup

### `/shared` - Shared Resources
- `schema.ts` - Database schema definitions

### `/config` - Configuration Files
- `vite.config.ts` - Frontend build configuration
- `tsconfig.json` - TypeScript configuration
- `tailwind.config.ts` - Styling configuration

### `/docs` - Documentation
- `CONTEXT.md` - Comprehensive project overview and context
- `PROJECT_DOCUMENTATION.md` - Technical documentation
- `ARCHITECTURE_ANALYSIS.md` - Architecture decisions
- `RENDER_DEPLOYMENT.md` - Deployment guide
- `database_schema.sql` - Database schema

### `/scripts` - Utilities
- `test-deployment.js` - Pre-deployment testing and validation

### `/supabase` - Database
- `migrations/` - Database migration files
- `config.toml` - Supabase project configuration

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `npm run test:deployment`
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

- **Issues**: GitHub Issues
- **Documentation**: `/docs/` directory
- **Deployment**: `docs/RENDER_DEPLOYMENT.md`

---

Built with React, TypeScript, Express, and AI
