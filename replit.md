# StudyWise AI - Intelligent Test Generator

## Overview

StudyWise AI is an intelligent test generation application that transforms passive study notes into active learning tools. The system guides users through uploading notes, creating customized tests through a wizard interface, and taking AI-generated quizzes. The application features a multi-layered accuracy system to ensure test questions are based solely on the provided notes, with automatic quality verification and proof sentences for each answer.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **UI Library**: Radix UI components with shadcn/ui design system
- **Styling**: Tailwind CSS with custom StudyWise AI color scheme and design tokens
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack React Query for server state management
- **Form Handling**: React Hook Form with Zod validation through Hookform Resolvers

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Development Server**: Custom Vite integration for hot reloading in development
- **Storage Interface**: Abstracted storage layer with in-memory implementation (MemStorage) and interface for database integration
- **Session Management**: PostgreSQL session store using connect-pg-simple

### Database Schema
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Database Provider**: Neon Database (serverless PostgreSQL)
- **Schema Structure**:
  - `users`: User profiles with preferences (quiz settings, notifications)
  - `tests`: Generated tests with questions, metadata, and source notes
  - `testResults`: Quiz results with scores, timing, and detailed answers
- **Validation**: Drizzle-Zod integration for runtime schema validation

### Project Structure
- **Monorepo Layout**: Shared schema and types between client and server
- **Client Directory**: React frontend with component-based architecture
- **Server Directory**: Express backend with modular route and storage organization
- **Shared Directory**: Common TypeScript types and database schema

### Authentication & Authorization
- **Session-based**: PostgreSQL session storage with Express sessions
- **User Management**: Basic user creation and retrieval through storage interface
- **Security**: Prepared for user authentication with existing user schema

### Development Environment
- **Hot Reloading**: Vite dev server integration with Express
- **TypeScript**: Strict type checking across frontend and backend
- **Path Aliases**: Configured for clean imports (@/, @shared/, @assets/)
- **Error Handling**: Runtime error overlay for development debugging

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: Serverless PostgreSQL database connection
- **drizzle-orm & drizzle-kit**: Database ORM and migration tooling
- **@tanstack/react-query**: Server state management and caching
- **@radix-ui/***: Comprehensive UI component primitives
- **express**: Node.js web framework for API server

### UI & Styling
- **tailwindcss**: Utility-first CSS framework
- **class-variance-authority**: Type-safe variant API for components
- **clsx & tailwind-merge**: Conditional and merged class name utilities
- **lucide-react**: Icon library for consistent iconography

### Development Tools
- **vite**: Build tool and development server
- **typescript**: Static type checking
- **tsx**: TypeScript execution for Node.js
- **esbuild**: Fast JavaScript bundler for production builds

### Additional Integrations
- **wouter**: Minimalist routing library for React
- **react-hook-form**: Performant forms with easy validation
- **zod**: TypeScript-first schema validation
- **date-fns**: Date utility library for time formatting
- **embla-carousel-react**: Carousel component for UI interactions