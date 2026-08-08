// Mirrors backend `jobMatchEntrySchema` + `resumeJobMatchSchema` in
// backend/src/models/resumes/resumeJobMatchModel.ts.
// Every function that returns a match object must be typed against JobMatchEntry
// so an inconsistent unwrap (like the old fetchResumeJobMatch envelope leak)
// becomes a compile error instead of a silent runtime bug.

export interface MatchComponents {
    skillMatch: number
    experienceFit: number
    semanticSim: number
    seniorityFit: number
    locationFit: number
    certBonus: number
}

export interface MatchMetadata {
    title: string
    location: string
    experienceLevel: string
    jobType: string
    salaryMin: number
    salaryMax: number
    salaryCurrency: string
    salaryFrequency: string
}

export type CareerFit = 'Strong' | 'Medium' | 'Weak'
export type RecommendationType = 'Best Fit' | 'Good Fit' | 'Stretch' | 'Poor Fit'

export interface JobMatchEntry {
    jobId: string
    finalScore: number
    vectorSimilarity: number
    components: MatchComponents
    careerFit: CareerFit
    recommendationType: RecommendationType
    matchedSkills: string[]
    missingSkills: string[]
    missingRequiredSkills: string[]
    strengths: string[]
    improvements: string[]
    penalties: string[]
    metadata: MatchMetadata
    explanation: string
    explanationGeneratedAt: string | null
}

export interface ResumeJobMatchDocument {
    _id?: string
    resume: string
    matches: JobMatchEntry[]
    totalMatches: number
    usedPinecone: boolean
    rankedAt: string
    createdAt?: string
    updatedAt?: string
}
