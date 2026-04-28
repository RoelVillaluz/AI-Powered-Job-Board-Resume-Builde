import logger from "../../../utils/logger.js"
import { safeQueueOperation } from "../../../utils/queueUtils.js";

type ExecutionOptions<T> = {
    queueFn: () => Promise<{ jobId: string }>;
    fallbackFn: () => Promise<T>;
}

export const executeWithFallback = async <T>({
    queueFn,
    fallbackFn
}: ExecutionOptions<T>) => {
    return safeQueueOperation(
        queueFn,      // ✅ already returns { jobId: string }
        fallbackFn    // ✅ already returns T
    );
};