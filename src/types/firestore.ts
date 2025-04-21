export interface InterviewRecord {
  id: string;
  candidateId: string;
  candidateName: string;
  role: string;
  companyName: string;
  interviewerName: string;
  interviewDate: string;
  decision: string;
  scores: {
    skill: {
      score: number;
      total: number;
      percentage: number;
    };
    will: {
      score: number;
      total: number;
      percentage: number;
    };
    total: {
      score: number;
      total: number;
      percentage: number;
    };
  };
  ratings: Record<string, number>;
  notes: Record<string, string>;
  createdAt: string;
  updatedAt: string;
  userId: string;
  createdBy: string;
  hired: boolean;
  isOwner?: boolean;
}