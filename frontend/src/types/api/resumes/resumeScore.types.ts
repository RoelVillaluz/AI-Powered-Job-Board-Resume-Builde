export interface ResumeScore {
    totalScore: number
    grade: string
    overallMessage: string
}

export type LegacyScoreResult =
    | { data: ResumeScore; status: "ready" }
    | { data: null; status: "queued"; jobId: string; statusUrl: string };
