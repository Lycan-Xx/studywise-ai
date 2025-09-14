const API_BASE_URL = import.meta.env.VITE_API_URL;

export const apiConfig = {
  baseURL: API_BASE_URL,
  endpoints: {
    generateQuestions: '/api/tests/generate',
    generateFlashcards: '/api/tests/flashcards',
    createTest: '/api/tests',
    saveResults: '/api/tests',
    generateInsights: '/api/tests',
    getLibrary: '/api/library',
    submitTestResults: '/api/tests'
  }
};

export default apiConfig
