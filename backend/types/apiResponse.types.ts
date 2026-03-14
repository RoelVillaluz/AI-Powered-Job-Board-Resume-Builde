// Generic API response type
export interface ApiResponse<T = any> {
    success: boolean;            // true for success, false for error
    formattedMessage: string;    // human-readable message
    data?: T;                    // optional payload
}