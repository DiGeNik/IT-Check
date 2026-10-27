export interface TaskScoreItem {
  taskName: string;
  score: number;
  maxScore: number;
  feedback: string;
}

export interface UniversalAnalysisDetails {
  tasks: TaskScoreItem[];
  strengths?: string;
  weaknesses?: string;
  statusSummary: string;
}

export interface AssignmentSettings {
  topicTitle: string;
  maxScore: number;
  rubricCriteria: string;
  referenceSolution: string;
}

export interface StudentSubmission {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  fileBase64?: string;
  textContent?: string;
  status: 'queued' | 'analyzing' | 'completed' | 'error';
  errorMessage?: string;
  studentName: string;
  totalScore: number;
  maxScore: number;
  tasks: TaskScoreItem[];
  classroomComment: string;
  details?: UniversalAnalysisDetails;
  isManuallyEdited?: boolean;
  copiedAt?: number;
}
