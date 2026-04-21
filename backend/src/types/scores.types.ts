export type ResumeScoreDoc = {
    completenessScore: number;
    experienceScore?: number | null; 
    skillsScore: number; 
    certificationScore?: number | null; 
    totalScore: number;
    calculatedAt: string | Date;
}

export type ResumeScoreValidationReturn = {
    valid: boolean;
    errors: string[];
    warnings: string[];
}