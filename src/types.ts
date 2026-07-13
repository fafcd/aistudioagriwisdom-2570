export interface Candidate {
  id: string;
  name: string;
  branch: 1 | 2 | 3 | 4; // 1 to 4 representing the branches
  province: string;
  district: string;
  organization: string;
  avatarUrl?: string;
}

export interface Evaluation {
  id: string;
  timestamp: string;
  committeeName: string;
  committeeAgency: string;
  branch: 1 | 2 | 3 | 4;
  candidateId: string;
  candidateName: string;
  candidateProvince: string;
  candidateDistrict: string;
  scores: Record<string, number>;
  totalScore: number;
  comments: string;
}

export interface CandidateStats {
  candidateId: string;
  name: string;
  branch: number;
  province: string;
  district: string;
  averageScore: number;
  voteCount: number;
  scoresBreakdown: Record<string, number>;
}

export interface Voter {
  id: string;
  name: string;
  agency: string;
  district: string; // "เขต 1" to "เขต 18"
}

