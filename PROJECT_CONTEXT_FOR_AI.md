# Project Context: StudyWise AI

## Project Overview
StudyWise AI is a comprehensive AI-powered learning platform that transforms static content into interactive assessments. It allows users to create courses from topics, generate module-specific tests, and receive detailed performance analytics driven by a multi-provider AI architecture.

## Tech Stack
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui.
- **State Management**: Zustand (Global state), React Query (Server state).
- **Backend**: Node.js, Express, TypeScript.
- **Database & Auth**: Supabase (PostgreSQL), Supabase Auth with Row-Level Security (RLS).
- **AI**: Multi-provider system (Gemini 2.0 Flash, DeepSeek, OpenRouter, Hugging Face).

## Core Architecture

### 1. Multi-Provider AI System (`server/services/AIService.ts`)
The platform uses a sophisticated failover mechanism to ensure high availability:
- **Primary Provider**: Gemini 2.0 Flash (via Google AI SDK).
- **Secondary Providers**: DeepSeek, OpenRouter (Llama 3, Mistral), Hugging Face.
- **Logic**: If a primary provider fails or hits rate limits, the `MultiProviderAIService` automatically falls back to the next available provider in the chain.

### 2. Database Analytics (`docs/studywise_complete_schema.sql`)
The performance tracking relies heavily on PostgreSQL Views:
- **`module_performance`**: Aggregates test results per module (average score, best score, attempts).
- **`course_performance`**: Aggregates module stats into course-level mastery metrics (`overall_average_score`).
- **Critical Note**: When querying course stats, use `overall_average_score` instead of `average_score`.

### 3. Test Lifecycle & Scoring
- **Generation**: Tests are generated using AI but immediately persisted to the `questions` table. 
- **ID Mapping**: The system uses **UUIDs** from the database for all question-answer correlations. *Do not use temporary numeric IDs from AI responses for submission.*
- **Grading**: The `ModuleTestController.ts` implements robust, case-insensitive, and trimmed string matching for answers to prevent false negatives.
- **Duration**: Precise time tracking is handled via `startTime` timestamps in the frontend and saved as `total_time_seconds`.

## Key Implementation Patterns

### Frontend (Client-side)
- **Routing**: Uses `wouter` for lightweight routing.
- **Services**: All API calls go through `client/src/services/apiService.ts`.
- **Components**: UI components are built using `shadcn/ui`. Most pages are located in `client/src/pages/`.

### Backend (Server-side)
- **Controllers**: Located in `server/controllers/`. `ModuleTestController.ts` handles the bulk of the test and exam logic.
- **Configuration**: `server/config.ts` is the single source of truth for environment variables and provider initializations.

## Important Stability Notes for Implementing
1. **Case Sensitivity**: Always use `.toLowerCase().trim()` when comparing user answers against correct answers in the database.
2. **Nullable Fields**: `module_id` in the `tests` table can be null (representing a course-level exam). Handle this gracefully in queries.
3. **Property Naming**: Be careful with property mismatches between DB views (snake_case) and frontend interfaces (camelCase or specific labels like `course_id`).
4. **Insights**: AI Insights (`requestAIAnalysis`) require raw question data. Ensure the `AIService` safely handles cases where `source_text` might be missing or null.

## Current Project State
- **Stability**: The test submission flow is fully stable and graded accurately.
- **Analytics**: The "Results" (Progress) page provides course-level expansion with module-level details.
- **Summary**: The test summary page provides rounded statistics and a clear review of right/wrong answers with explanations.

## Quick References
- **Main API Routes**: `server/routes.ts`
- **Primary Controller**: `server/controllers/ModuleTestController.ts`
- **Main AI Logic**: `server/services/AIService.ts`
- **Schema**: `docs/studywise_complete_schema.sql`
