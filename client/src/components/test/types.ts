export interface TestConfig {
  subject: string;
  topics: string[];
  questionType: 'mcq' | 'true-false';
  numberOfQuestions: number;
}