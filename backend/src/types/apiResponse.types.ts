// Generic API response type
export interface ApiSendResponse<T = any> {
    success: boolean;            // true for success, false for error
    formattedMessage: string;    // human-readable message
    data?: T;                    // optional payload
}

export interface ApiQueueResponse<T = any> {
    success: boolean;
    cached: boolean;
    message: string;
    jobId: string;
    statusUrl: string;
}