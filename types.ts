export interface Question {
  id: number;
  type: 'single' | 'multiple';
  text: string;
  options: string[];
  correctAnswerIndices: number[]; // Changed from single index to array
  explanation: string;
}

export interface ExamResult {
  score: number;
  totalQuestions: number;
  correctCount: number;
  wrongCount: number;
  userAnswers: Record<number, number[]>; // questionId -> array of selected indices
}

export enum AppState {
  IDLE = 'IDLE',
  PROCESSING = 'PROCESSING',
  EXAM = 'EXAM',
  RESULT = 'RESULT',
}

export interface ApiError {
  message: string;
  type: 'api' | 'parsing' | 'network';
}