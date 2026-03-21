// sendResponse.d.ts
export function sendResponse<T>(
    res: any,
    payload: {
        code: number;
        message: string;
        data?: T;
        success?: boolean;
    },
    model?: string
): ApiResponse<T>;