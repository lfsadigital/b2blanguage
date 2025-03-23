export type StudentLevel = 'Beginner' | 'Medium' | 'Advanced';
export type QuestionType = 'multiple-choice' | 'open-ended' | 'true-false';

export interface TestFormData {
  professorName: string;
  studentName: string;
  contentUrl: string;
  studentLevel: StudentLevel;
  questionTypes: QuestionType[];
  numberOfQuestions: number;
  additionalNotes: string;
} 