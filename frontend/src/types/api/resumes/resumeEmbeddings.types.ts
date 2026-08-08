export interface ResumeEmbeddings {
    resume: string
    embeddings: {
        jobTitle: number[]
        location: number[]
    }
    meanEmbeddings: {
        skills?: number[]
        workExperience?: number[]
        certifications?: number[]
    }
    metrics?: {
        totalExperienceYears: number
    }
    generatedAt: string
}
