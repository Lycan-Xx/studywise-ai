# StudyWise AI - Intelligent Test Generator

A modern full-stack application that uses AI to generate personalized tests and study materials from any text content.

## 🏗️ Project Structure

```
studywise-ai/
├── client/                 # React frontend application
│   ├── src/
│   ├── public/
│   └── index.html
├── server/                 # Node.js/Express backend
│   ├── controllers/
│   ├── services/
│   ├── routes.ts
│   └── index.ts
├── shared/                 # Shared types and utilities
├── config/                 # Configuration files
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── tailwind.config.ts
│   └── ...
├── scripts/                # Build and deployment scripts
├── docs/                   # Documentation
├── supabase/               # Database migrations
└── dist/                   # Build output (generated)
```

## 🚀 Quick Start

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

4. **Start development servers**
   ```bash
   # Start both client and server concurrently
   npm run dev

   # Or start individually:
   npm run dev:server  # Terminal 1
   npm run dev:client  # Terminal 2
   ```

5. **Open your browser**
   - Frontend: http://localhost:8080
   - Backend API: http://localhost:5000

## 📋 Available Scripts

### Development
```bash
npm run dev              # Start both client and server
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

## 🔧 Configuration

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
- `POST /api/tests/:testId/results` - Save test results
- `POST /api/tests/:testId/insights` - Generate AI insights
- `GET /health` - Health check

## 🏛️ Architecture

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
- **AI Integration**: Google Gemini + OpenRouter
- **Authentication**: Supabase Auth
- **Database**: Supabase (PostgreSQL)
- **Deployment**: Render

### Key Features
- 🤖 **Multi-Provider AI**: Gemini, GPT, Claude support
- 📚 **Smart Test Generation**: Multiple question types
- 🎯 **Adaptive Learning**: Personalized difficulty
- 📊 **Performance Analytics**: Detailed insights
- 🔄 **Real-time Sync**: Live test taking
- 📱 **Responsive Design**: Mobile-first approach

## 🚀 Deployment

### Backend (Render)
1. Connect your GitHub repository to Render
2. Create a Blueprint deployment using `render.yaml`
3. Configure environment secrets
4. Deploy automatically

### Frontend (Netlify/Vercel)
1. Build the client: `npm run build:client`
2. Deploy `dist/public/` directory
3. Set `VITE_API_URL` to your backend URL

See `docs/RENDER_DEPLOYMENT.md` for detailed instructions.

## 🧪 Testing

### Pre-deployment Testing
```bash
npm run test:deployment
```

This script checks:
- Environment variables
- File structure
- Server startup
- API connectivity

## 📁 Directory Guide

### `/client` - Frontend Application
- `src/components/` - Reusable UI components
- `src/pages/` - Page components
- `src/stores/` - Zustand state management
- `src/hooks/` - Custom React hooks
- `src/lib/` - Utilities and configurations

### `/server` - Backend Application
- `controllers/` - Route handlers
- `services/` - Business logic (AI, database)
- `routes.ts` - API route definitions
- `index.ts` - Server entry point

### `/config` - Configuration Files
- `vite.config.ts` - Frontend build configuration
- `tsconfig.json` - TypeScript configuration
- `tailwind.config.ts` - Styling configuration

### `/docs` - Documentation
- `PROJECT_DOCUMENTATION.md` - Technical documentation
- `ARCHITECTURE_ANALYSIS.md` - Architecture decisions
- `RENDER_DEPLOYMENT.md` - Deployment guide

### `/scripts` - Utilities
- `test-deployment.js` - Pre-deployment testing

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `npm run test:deployment`
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

## 🆘 Support

- **Issues**: GitHub Issues
- **Documentation**: `/docs/` directory
- **Deployment**: `docs/RENDER_DEPLOYMENT.md`

---

Built with ❤️ using React, TypeScript, Express, and AI
