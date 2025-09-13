const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'; 

export const apiConfig = {
  baseURL: API_BASE_URL,
  endpoints: {
    generateQuestions: '/api/tests/generate',
    generateFlashcards: '/api/tests/flashcards',
    saveResults: '/api/tests',
    generateInsights: '/api/tests'
  }
}; 

export default apiConfig