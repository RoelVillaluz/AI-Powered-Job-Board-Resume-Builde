export interface SalaryPrediction {
    resume: string
    predictedYearly: number
    predictedMonthly: number
    rangeMin: number
    rangeMax: number
    confidenceScore: number
    seniorityLevel: string | null
    totalExperienceYears: number | null
    calculatedAt: string
    calculationVersion: string
}
