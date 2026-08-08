export interface GenerateInsightResponse {
    success: boolean
    formattedMessage: string
    data: { jobId: string; statusUrl: string }
}
