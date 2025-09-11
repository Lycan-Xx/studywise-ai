This server is the backend for an AI-powered educational application called **StudyWise AI**. Let me break down what it does in simple terms:

## What This Server Does

**Main Purpose**: It creates intelligent tests and study materials from any text content you provide, using Google's Gemini AI.

## Key Features

### 1. **AI-Powered Test Generation**
- Takes your study notes, articles, or documents
- Generates different types of questions:
  - Multiple choice questions
  - True/False questions  
  - Short answer questions
  - Essay questions
- Adjusts difficulty (easy, medium, hard)
- Creates the right number of questions you request

### 2. **Flashcard Creation**
- Automatically generates flashcards from your content
- Creates question-answer pairs for studying

### 3. **Test Management**
- Saves test results when you complete a quiz
- Tracks your performance and scores

### 4. **User System**
- Basic user authentication (currently using mock users)
- Each user gets their own generated content

## How It Works (Technical Overview)

### **Server Setup** (`index.ts`)
- Runs on port 5000
- Uses Express.js framework
- Handles JSON data and CORS for web browsers
- Has a health check endpoint at `/health`

### **AI Service** (`AIService.ts`)
- Connects to Google's Gemini AI API
- Uses two AI models:
  - **Gemini Pro**: For generating high-quality questions
  - **Gemini Flash**: For validating questions and as backup
- Caches responses to avoid repeating API calls
- Falls back to mock questions if AI isn't available

### **API Endpoints** (`routes.ts`)
- `POST /api/tests/generate` - Create questions from content
- `POST /api/tests/flashcards` - Generate flashcards
- `POST /api/tests/:testId/results` - Save test results
- `GET /api/library` - Get user's saved content (placeholder)

### **Data Storage** (`storage.ts`)
- Currently uses in-memory storage (data disappears when server restarts)
- Stores user information
- Ready to be upgraded to a real database

### **Development Tools** (`vite.ts`)
- Integrates with Vite for development
- Serves the frontend application
- Handles hot reloading during development

## Example Usage

When you send this request:
```json
{
  "content": "Photosynthesis is the process where plants convert sunlight into energy...",
  "difficulty": "medium",
  "questionCount": 5,
  "questionTypes": ["multiple-choice", "true-false"]
}
```

The server will:
1. Send your content to Gemini AI
2. Get back 5 questions (mix of multiple choice and true/false)
3. Validate the questions are accurate
4. Return them in a structured format

## Current Status

- ✅ AI question generation working
- ✅ Basic flashcard creation
- ✅ Test result submission
- 🔄 User authentication (mock only)
- 🔄 Database integration (in-memory only)
- 🔄 Library management (placeholder)

This is a solid foundation for an educational AI tool that can help students create personalized study materials from any text content!