export type StudentLevel = "Beginner" | "Medium" | "Advanced";
export type QuestionType = "multiple-choice" | "open-ended" | "true-false";

// Debug version marker: v1.2.1-debug-2024-03-28 (Deployment Fix)
export interface TestFormData {
  professorName: string;
  professorId: string;
  studentName: string;
  studentId: string;
  contentUrl: string;
  studentLevel: StudentLevel;
  questionTypes: QuestionType[];
  numberOfQuestions: number;
  additionalNotes: string;
  // Optional fields for YouTube optimization
  useTranscriptApproach?: boolean;
  youtubeVideoId?: string;
}
