export interface DraftRFI {
  id: string;
  title: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  discipline: string;
  subject: string;
  description: string;
  question: string;
  recommendation: string;
  relatedConflicts: string[];
}

export interface GeminiRfiRefinement {
  conflictId: string;
  description: string;
  question: string;
  recommendation: string;
}
