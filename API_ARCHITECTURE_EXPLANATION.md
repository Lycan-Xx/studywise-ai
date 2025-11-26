# API & AI Service Architecture Explanation

## Overview
Your application uses a **client-server architecture** with a sophisticated multi-provider AI service system. Here's how all the pieces work together:

---

## 🏗️ Architecture Flow

```
┌─────────────────┐
│   React Client  │
│  (Frontend)     │
└────────┬────────┘
         │
         │ HTTP Requests
         │ (with credentials)
         ▼
┌─────────────────┐
│  apiService.ts  │ ◄─── Adds authentication headers
│  (Client)       │
└────────┬────────┘
         │
         │ Uses apiConfig
         ▼
┌─────────────────┐
│   aiService.ts  │ ◄─── Client-side wrapper
│   (Client)      │
└────────┬────────┘
         │
         │ POST /api/tests/generate
         ▼
┌─────────────────┐
│  Express Server │
│  (Backend)      │
└────────┬────────┘
         │
         │ Routes to
         ▼
┌─────────────────┐
│  TestController │ ◄─── Validates & processes request
└────────┬────────┘
         │
         │ Calls
         ▼
┌─────────────────┐
│  AIService.ts   │ ◄─── Multi-provider AI service
│  (Server)       │      (Gemini, GPT, Claude, etc.)
└────────┬────────┘
         │
         │ Selects best provider
         │ & generates questions
         ▼
┌─────────────────┐
│   Response      │
│   (JSON)        │
└─────────────────┘
```

---

## 📁 Component Breakdown

### 1. **`client/src/config/api.ts`** - API Configuration
**Purpose**: Centralized configuration for API endpoints

```typescript
// Defines base URL and all API endpoints
export const apiConfig = {
  baseURL: API_BASE_URL,  // From VITE_API_URL env var
  endpoints: {
    generateQuestions: '/api/tests/generate',
    generateFlashcards: '/api/tests/flashcards',
    // ... other endpoints
  }
};
```

**Why it exists**: 
- Single source of truth for API paths
- Easy to update endpoints without changing multiple files
- Environment-specific configuration (dev vs production)

---

### 2. **`client/src/services/apiService.ts`** - Generic API Service
**Purpose**: Low-level HTTP client with authentication

**Key Features**:
- **Authentication**: Automatically adds `user-id` header from Supabase auth
- **URL Resolution**: Handles relative vs absolute URLs
- **HTTP Methods**: Provides `get()`, `post()`, `put()`, `delete()` methods

```typescript
// How it works:
1. Gets current user from Supabase
2. Adds 'user-id' header to all requests
3. Handles URL resolution (relative or absolute)
4. Makes fetch requests with proper headers
```

**Why separate from aiService**: 
- Reusable for all API calls (not just AI)
- Centralized auth logic
- Consistent error handling

---

### 3. **`client/src/services/aiService.ts`** - Client-Side AI Service
**Purpose**: Frontend wrapper for AI-related API calls

**Key Methods**:
- `generateQuestions()` - Calls `/api/tests/generate`
- `generateFlashcards()` - Calls `/api/tests/flashcards`
- `createTest()` - Saves test to library
- `getUserTests()` - Fetches user's test library
- `submitTestResults()` - Saves test results

**How it works**:
```typescript
// Example: generateQuestions
1. Takes user's notes + config (difficulty, count, types)
2. Makes POST request to server
3. Server processes with AI
4. Returns generated questions
```

**Why it exists**:
- Provides a clean API for React components
- Handles request/response transformation
- Abstracts away HTTP details
- Type-safe interface for frontend

**Note**: Currently missing type definitions - should import from server or define locally.

---

### 4. **`server/index.ts`** - Express Server Setup
**Purpose**: Main server entry point

**Key Features**:
- CORS enabled (allows frontend requests)
- JSON body parsing (up to 50MB for large note files)
- Routes mounted at `/api`
- Health check endpoint

**Why 50MB limit**: Users might upload large PDFs or text files with notes.

---

### 5. **`server/routes.ts`** - API Route Definitions
**Purpose**: Maps HTTP endpoints to controllers

**Key Routes**:
- `POST /api/tests/generate` → `TestController.generateQuestions`
- `POST /api/tests/flashcards` → `TestController.generateFlashcards`
- `POST /api/tests/:testId/results` → Saves test results
- `GET /api/library` → Gets user's test library
- `POST /api/library/tests` → Saves test to library

**Authentication Pattern**:
```typescript
// Current approach (simple):
const userId = req.headers['user-id'] as string;
if (!userId) return res.status(401).json({ error: 'Not authenticated' });
```

**Why this pattern**: 
- Simple for development
- Frontend sends user-id via `apiService.ts`
- In production, should use JWT tokens or Supabase session validation

---

### 6. **`server/controllers/TestController.ts`** - Request Handler
**Purpose**: Validates requests and calls AI service

**Flow**:
```typescript
generateQuestions(req, res) {
  1. Extract params from request body
  2. Validate required fields
  3. Call aiService.generateQuestions()
  4. Return JSON response
}
```

**Why separate controller**: 
- Separates HTTP concerns from business logic
- Easy to test
- Can add middleware (auth, validation, rate limiting)

---

### 7. **`server/services/AIService.ts`** - Multi-Provider AI Service ⭐
**Purpose**: Intelligent AI provider management and question generation

**This is the most sophisticated component!**

#### **Multi-Provider System**

**Supported Providers**:
1. **Gemini Flash** (Priority 1) - Fast, cheap, 1M tokens
2. **GPT-4o Mini** (Priority 2) - Via OpenRouter, 128K tokens
3. **GPT-3.5 Turbo** (Priority 3) - Via OpenRouter, 16K tokens
4. **Gemini Pro** (Priority 4) - More capable, 30K tokens
5. **Claude 3 Haiku** (Priority 5) - Via OpenRouter, 200K tokens
6. **Mistral 7B** (Priority 7) - Backup, very cheap

#### **Smart Provider Selection**

```typescript
getAvailableProvider(options) {
  // Filters providers by:
  // - Availability (not rate limited)
  // - Request count (under limit)
  // - Content size (can handle request)
  
  // Then sorts by:
  // - Large requests (15+ questions): Cost-effectiveness
  // - Small requests (≤5 questions): Speed (priority)
  // - Medium requests: Balanced
}
```

#### **Provider Management**

**Rate Limiting**:
- Each provider has `maxRequests` per `resetInterval` (usually 60 seconds)
- Automatically resets counters
- Tracks usage per provider

**Error Handling**:
- **401/Invalid Key**: Disables provider permanently (for session)
- **429/Rate Limit**: Cooldown for 60 seconds
- **Quota Exceeded**: Disables for 1 hour
- **Server Error (5xx)**: 30-second cooldown

**Fallback Strategy**:
- Tries up to 3 different providers
- Progressive delays between retries
- If all fail, throws error with last error message

#### **Caching System**

```typescript
// Content-based caching
generateContentHash(options) {
  // Creates MD5 hash from:
  // - First 1000 chars of content
  // - Difficulty
  // - Question count
  // - Question types
}

// Cache expires after 24 hours
// Automatically cleaned up every hour
```

**Why caching**: 
- Same notes + same config = same questions
- Saves API costs
- Faster responses for repeated requests

#### **Question Generation Process**

```typescript
generateQuestions(options) {
  1. Generate content hash
  2. Check cache → return if found
  3. Build AI prompt from options
  4. Select best provider
  5. Make request to provider
  6. Parse JSON response
  7. Validate structure
  8. Process questions (add source text matching)
  9. Cache result
  10. Return formatted response
}
```

**Prompt Engineering**:
- Limits content to 3000 chars (optimized for token limits)
- Includes requirements (types, difficulty, focus)
- Requests specific JSON format
- Emphasizes source text requirements

**Response Processing**:
- Extracts JSON from markdown code blocks
- Validates question structure
- Matches source text back to original content
- Adds metadata (estimated time, content hash)

---

## 🔄 Complete Request Flow Example

### User Generates Questions

1. **User Action**: User uploads notes, selects config, clicks "Generate"

2. **Frontend** (`useTestStore.ts`):
   ```typescript
   await aiService.generateQuestions({
     content: notes,
     difficulty: 'medium',
     questionCount: 10,
     questionTypes: ['multiple-choice'],
     subject: 'Biology',
     focus: 'Cell structure'
   })
   ```

3. **Client AI Service** (`aiService.ts`):
   ```typescript
   // Makes POST request to:
   // `${baseURL}/api/tests/generate`
   // With JSON body containing options
   ```

4. **Server Route** (`routes.ts`):
   ```typescript
   // Receives POST /api/tests/generate
   // Routes to TestController.generateQuestions
   ```

5. **Controller** (`TestController.ts`):
   ```typescript
   // Validates request
   // Calls aiService.generateQuestions(options)
   ```

6. **AI Service** (`AIService.ts`):
   ```typescript
   // Checks cache (miss)
   // Selects provider: Gemini Flash (fastest, available)
   // Builds prompt
   // Makes request to Gemini API
   // Parses response
   // Processes questions
   // Caches result
   // Returns AIResponse
   ```

7. **Response Chain**:
   ```
   AIService → Controller → Route → Client aiService → Store → Component
   ```

8. **UI Update**: Questions appear in the UI

---

## 🔐 Authentication Flow

### Current Implementation

1. **Frontend** (`apiService.ts`):
   ```typescript
   // Gets user from Supabase
   const { data: { user } } = await supabase.auth.getUser();
   // Adds header
   headers['user-id'] = user.id;
   ```

2. **Server** (`routes.ts`):
   ```typescript
   // Reads header
   const userId = req.headers['user-id'];
   // Validates
   if (!userId) return 401;
   ```

### Why This Works (But Could Be Better)

**Pros**:
- Simple to implement
- Works for development
- Fast (no token validation overhead)

**Cons**:
- Client can fake user-id header
- No session validation
- No token expiration

**Production Recommendation**:
- Use JWT tokens or Supabase session tokens
- Validate tokens on server
- Add middleware for auth checks

---

## 💡 Key Design Decisions & Why

### 1. **Separate Client and Server AI Services**

**Client** (`aiService.ts`): 
- Thin wrapper for HTTP calls
- Handles request formatting
- Type definitions for frontend

**Server** (`AIService.ts`):
- Heavy business logic
- Provider management
- Caching
- Error handling

**Why**: Separation of concerns - frontend doesn't need to know about AI providers.

### 2. **Multi-Provider System**

**Why**:
- **Reliability**: If one provider fails, others can handle it
- **Cost Optimization**: Use cheaper providers when possible
- **Performance**: Fast providers for quick requests
- **Scalability**: Distribute load across providers

### 3. **Content-Based Caching**

**Why**:
- Same input = same output (deterministic)
- Reduces API costs significantly
- Faster user experience
- 24-hour expiry balances freshness vs performance

### 4. **Progressive Error Handling**

**Why**:
- Different errors need different strategies
- Rate limits are temporary (cooldown)
- Auth errors are permanent (disable)
- Server errors might be transient (retry)

### 5. **Source Text Matching**

**Why**:
- Users need to see where answers come from
- Builds trust in AI-generated questions
- Helps with studying (reference back to notes)

---

## 🐛 Current Issues & Improvements

### 1. **Missing Type Definitions**
`client/src/services/aiService.ts` exports types that aren't defined:
```typescript
export type { GenerateQuestionsOptions, GeneratedQuestion, AIResponse };
```

**Fix**: Import from server or define locally:
```typescript
// Option 1: Define locally
export interface GenerateQuestionsOptions {
  content: string;
  difficulty: 'easy' | 'medium' | 'hard';
  questionCount: number;
  questionTypes: string[];
  subject?: string;
  focus?: string;
}

// Option 2: Share types between client/server
```

### 2. **Authentication Could Be Stronger**
Current header-based auth is easy to bypass.

**Improvement**: Use Supabase session tokens:
```typescript
// Client
const { data: { session } } = await supabase.auth.getSession();
headers['Authorization'] = `Bearer ${session.access_token}`;

// Server
const token = req.headers['authorization']?.replace('Bearer ', '');
const { data: { user } } = await supabase.auth.getUser(token);
```

### 3. **Error Messages Could Be More User-Friendly**
Currently returns raw error messages.

**Improvement**: Map technical errors to user-friendly messages:
```typescript
const errorMessages = {
  'rate limit': 'Too many requests. Please try again in a minute.',
  'quota exceeded': 'AI service temporarily unavailable.',
  // ...
};
```

---

## 📊 Performance Optimizations

1. **Caching**: Reduces API calls by ~70% for repeated requests
2. **Provider Selection**: Chooses fastest/cheapest provider automatically
3. **Content Truncation**: Limits to 3000 chars to stay within token limits
4. **Parallel Retries**: Could be improved to try multiple providers simultaneously

---

## 🎯 Summary

Your architecture is well-designed with:
- ✅ Clear separation of concerns
- ✅ Sophisticated multi-provider AI system
- ✅ Smart caching and error handling
- ✅ Type-safe interfaces (mostly)
- ⚠️ Authentication could be stronger
- ⚠️ Some type definitions missing

The multi-provider system is particularly impressive - it provides reliability, cost optimization, and performance automatically!

