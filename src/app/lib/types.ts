export type StudentLevel = 'Beginner' | 'Medium' | 'Advanced';
export type QuestionType = 'multiple-choice' | 'open-ended' | 'true-false';

// Debug version marker: v1.2.1-debug-2024-03-23
export interface TestFormData {
  professorName: string;
  studentName: string;
  contentUrl: string;
  studentLevel: StudentLevel;
  questionTypes: QuestionType[];
  numberOfQuestions: number;
  additionalNotes: string;
} 