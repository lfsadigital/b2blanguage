export type StudentLevel = 'Beginner' | 'Medium' | 'Advanced';
export type QuestionType = 'multiple-choice' | 'open-ended' | 'true-false';

export interface QuestionCounts {
  'multiple-choice': number;
  'open-ended': number;
  'true-false': number;
}

// Debug version marker: v1.2.1-debug-2024-03-28 (Deployment Fix)
export interface TestFormData {
  professorName: string;
  professorId: string;
  studentName: string;
  studentId: string;
  contentUrl: string;
  studentLevel: StudentLevel;
  questionCounts: QuestionCounts;
  additionalNotes: string;
  useTranscriptApproach: boolean;
  youtubeVideoId?: string;
}
