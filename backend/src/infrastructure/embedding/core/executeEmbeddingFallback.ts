import logger from "../../../utils/logger";
import { safeQueueOperation } from "../../../utils/queueUtils";

type ExecutionOptions<T> = {
    queueFn: () => Promise<{ jobId: string }>;
    fallbackFn: () => Promise<T>;
}

export const executeEmbeddingFallback = async <T>({
    queueFn,
    fallbackFn
}: ExecutionOptions<T>) => {
    return safeQueueOperation(
        queueFn,      // ✅ already returns { jobId: string }
        fallbackFn    // ✅ already returns T
    );
};