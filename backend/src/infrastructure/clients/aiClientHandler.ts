import axios from "axios";
import { Readable } from "stream";
import { UnrecoverableError } from "bullmq";

const AI_SERVICE_URL =
    process.env.AI_SERVICE_URL ?? "http://localhost:8000";

const AI_SERVICE_SHARED_SECRET = process.env.AI_SERVICE_SHARED_SECRET ?? "";

export interface AiServiceResponse<T = unknown> {
    data: T;
    error?: string;
}

export interface AiStreamEvent {
    type: "start" | "delta" | "restart" | "fallback" | "end" | "error";
    delta?: string;
    full?: string;
    answer?: string;
    message?: string;
    jobId?: string;
}

const client = axios.create({
    baseURL: AI_SERVICE_URL,
    timeout: 30000, // 30s (important for ML workloads)
    headers: {
        "Content-Type": "application/json",
        "X-Internal-Service-Key": AI_SERVICE_SHARED_SECRET,
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

/**
 * Streaming AI service caller for NDJSON endpoints (e.g. match insight).
 * Yields parsed events as they arrive; the request stays open until the AI
 * service closes the stream or `signal` is aborted. An abort is translated
 * into an UnrecoverableError so BullMQ never retries a cancelled job.
 */
export async function* aiClientStream(
    endpoint: string,
    payload: Record<string, unknown>,
    signal?: AbortSignal
): AsyncGenerator<AiStreamEvent> {
    let res;
    try {
        res = await client.post(
            `/compute/${endpoint}`,
            payload,
            { responseType: "stream", timeout: 0, signal }
        );
    } catch (error: any) {
        if (signal?.aborted || error?.code === "ERR_CANCELED") {
            throw new UnrecoverableError(
                `Match insight generation aborted by client [${endpoint}]`
            );
        }
        if (error.response) {
            throw new Error(
                `AI service [${error.response.status}] ${endpoint}: ${JSON.stringify(error.response.data)}`
            );
        }
        throw new Error(`AI service unreachable: ${endpoint}`);
    }

    const stream = res.data as Readable;
    let buffer = "";

    try {
        for await (const chunk of stream) {
            buffer += chunk.toString();
            let newline;
            while ((newline = buffer.indexOf("\n")) !== -1) {
                const line = buffer.slice(0, newline).trim();
                buffer = buffer.slice(newline + 1);
                if (!line) continue;
                yield JSON.parse(line) as AiStreamEvent;
            }
        }
    } catch (error: any) {
        if (signal?.aborted || error?.code === "ERR_CANCELED") {
            throw new UnrecoverableError(
                `Match insight generation aborted by client [${endpoint}]`
            );
        }
        throw error;
    }
}