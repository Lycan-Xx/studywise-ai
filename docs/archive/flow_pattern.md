# StudyWise AI Platform - Comprehensive Flow Documentation

## Overview
StudyWise AI is an intelligent study platform that transforms user-uploaded documents into personalized practice tests with AI-powered question generation and performance insights.

## Core User Journey Flow

### 1. Document Upload & Processing
**Location**: Dashboard (`client/src/pages/dashboard.tsx`)
**Process**:
- User accesses dashboard from landing page
- Uploads documents via drag-and-drop or file picker
- Supported formats: PDF, DOCX, Markdown, Plain Text
- **Document Processing** (`client/src/utils/documentProcessor.ts`):
  - PDF files: Processed using PDF.js library to extract text content
  - DOCX files: Converted using Mammoth.js library
  - Text/Markdown: Direct text extraction
- Content appears in textarea for review/editing
- Auto-extraction of topics using frequency analysis
- Manual topic addition/removal supported

### 2. Test Generation
**Location**: Dashboard → Test Generation
**Process**:
- User clicks "Generate with Defaults" or "Customize"
- **Default Configuration**:
  - 10 Multiple Choice Questions (MCQ)
  - Medium difficulty
  - Auto-generated title from content
  - Auto-detected topics
- **Custom Configuration**:
  - Question types: MCQ, True/False
  - Difficulty levels: Easy, Medium, Hard
  - Question count: 5-30 questions
  - Custom title and topics

**AI Service** (`server/services/AIService.ts`):
- Multi-provider AI system (Gemini, OpenRouter with GPT/Claude)
- Content hashing for caching
- Prompt engineering for educational question generation
- Response validation and error handling
- Questions include source text references

### 3. Test Preview & Configuration
**Location**: TestPreviewOverlay (`client/src/components/test/TestPreviewOverlay.tsx`)
**Features**:
- Review generated questions before starting
- Regenerate questions with different settings
- View source content references
- Start test with optional time limit
- Auto-save test to library upon generation

### 4. Test Taking Experience
**Location**: TestTakingOverlay (`client/src/components/test/TestTakingOverlay.tsx`)
**Process**:
- Timer functionality (optional)
- Question navigation
- Answer selection and storage
- Progress tracking
- Test completion handling

### 5. Test Submission & Scoring
**Location**: Test workflow (`client/src/stores/useTestWorkflow.ts`)
**Process**:
- Answer validation and scoring
- **Score Calculation**:
  - Percentage based on correct answers
  - Time tracking (if timed)
- **Data Storage**:
  - Test results saved to `test_results` table
  - Session data in `test_sessions` table
  - User answers stored as JSONB

### 6. AI-Powered Insights Generation
**Location**: AI Service insights endpoint
**Process**:
- **Input Data**:
  - Test score and performance metrics
  - Incorrect questions analysis
  - Source content context
  - User answer patterns
- **AI Analysis** (`server/services/AIService.ts`):
  - Performance assessment
  - Strength/weakness identification
  - Study recommendations
  - Focus area suggestions
- **Fallback System**: Basic insights if AI fails

### 7. Results Display & Analysis
**Location**: TestResultsOverlay (`client/src/components/test/TestResultsOverlay.tsx`)
**Features**:
- Score display with percentage
- Time taken (if applicable)
- Question-by-question review
- AI-generated insights:
  - Overall performance summary
  - Strengths identified
  - Weaknesses to address
  - Study recommendations
  - Focus areas for improvement
- Options: Retake test, retake wrong questions, return to library

### 8. Library Management
**Location**: Library page (`client/src/pages/library.tsx`)
**Features**:
- **Automatic Test Saving**:
  - Tests saved to `tests` table upon generation
  - Questions stored in `questions` table
  - Metadata includes source content
- **Library Operations**:
  - View all saved tests
  - Edit test notes/content
  - Start existing tests
  - Delete tests
- **Test Regeneration**:
  - Modify existing tests
  - Regenerate questions from same source
  - Update configurations

### 9. Scores & Progress Tracking
**Location**: Scores tab (integrated with library/results)
**Data Storage**:
- All test results in `test_results` table
- Performance analytics via database views
- Learning streaks and goals tracking

## Technical Architecture Flow

### Frontend Architecture
```
Dashboard → Document Upload → Text Processing → Test Generation → Preview → Taking → Results → Library
```

### Backend Services
```
API Routes → AI Service → Database Operations → Response Formatting
```

### Data Flow
```
User Input → Document Processing → AI Question Generation → Test Creation → Session Management → Results Analysis → Insights Generation → Data Persistence
```

## Key Components & Their Roles

### Core Components
- **Dashboard**: Entry point, document upload, test generation
- **TestPreviewOverlay**: Question review and test configuration
- **TestTakingOverlay**: Interactive test interface with timer
- **TestResultsOverlay**: Results display with AI insights
- **Library**: Test management and storage

### Services
- **AIService**: Multi-provider AI question generation and insights
- **DocumentProcessor**: File format conversion to text
- **API Service**: Client-server communication

### State Management
- **useTestStore**: Test generation and question management
- **useLibraryStore**: Test library operations
- **useTestSessionStore**: Active test session management
- **useTestWorkflow**: Test completion and results handling

### Database Schema
- **tests**: Test metadata and configuration
- **questions**: Individual questions with answers
- **test_sessions**: Active test attempts
- **test_results**: Completed test scores and analytics
- **profiles**: User information and preferences

## AI Integration Points

### Question Generation
- Content analysis and topic extraction
- Question type and difficulty adaptation
- Source text referencing for answer validation

### Performance Insights
- Score analysis and performance categorization
- Weakness identification from incorrect answers
- Personalized study recommendations
- Learning pattern recognition

## User Experience Flow Summary

1. **Upload**: User uploads study material (PDF/DOCX/TXT/MD)
2. **Process**: Content converted to text and displayed for review
3. **Generate**: AI creates questions based on content and user preferences
4. **Preview**: User reviews and can regenerate questions
5. **Take**: Interactive test with optional timer
6. **Submit**: Answers processed and scored
7. **Analyze**: AI generates performance insights
8. **Review**: Results displayed with recommendations
9. **Save**: Test automatically saved to library for future use
10. **Reuse**: User can retake, modify, or regenerate tests

## Error Handling & Fallbacks

- **Document Processing**: Graceful failure with user feedback
- **AI Generation**: Multi-provider fallback system
- **Test Taking**: Auto-save of progress
- **Insights**: Basic insights if AI analysis fails
- **Network Issues**: Offline capability for saved tests

## Performance Optimizations

- **Caching**: AI responses cached by content hash
- **Lazy Loading**: Components loaded as needed
- **Database Indexing**: Optimized queries for test retrieval
- **CDN**: Static assets served via CDN
- **Progressive Loading**: UI loads incrementally

This comprehensive flow ensures a seamless experience from document upload to actionable learning insights, with robust error handling and performance optimizations throughout the platform.
