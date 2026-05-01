// sendResponse.d.ts
export function sendResponse(
    res: any,
    payload: {
        code: number;
        message: string;
        data?: any;
        success?: boolean;
        cached?: boolean;
    },
    model?: string
): void;