import axios from "axios";

const AI_SERVICE_URL =
    process.env.AI_SERVICE_URL ?? "http://localhost:8000";

export interface AiServiceResponse<T = unknown> {
    data: T;
    error?: string;
}

const client = axios.create({
    baseURL: AI_SERVICE_URL,
    timeout: 30000, // 30s (important for ML workloads)
    headers: {
        "Content-Type": "application/json",
    },
});

/**
 * Generic AI service caller
 */
export const aiClient = async <T = unknown>(
    endpoint: string,
    payload: Record<string, unknown>
): Promise<T> => {
    try {
        const res = await client.post<AiServiceResponse<T>>(
            `/compute/${endpoint}`,
            payload
        );

        if (res.data.error) {
            throw new Error(
                `AI service error [${endpoint}]: ${res.data.error}`
            );
        }

        return res.data.data;

    } catch (error: any) {
        // Axios-specific error handling
        if (error.response) {
            throw new Error(
                `AI service [${error.response.status}] ${endpoint}: ${JSON.stringify(error.response.data)}`
            );
        }

        if (error.request) {
            throw new Error(
                `AI service unreachable: ${endpoint}`
            );
        }

        throw error;
    }
};