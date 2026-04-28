/**
 * Configuration options for creating an embedding queue runner.
 * 
 * @template TPayload - The queue job payload type
 */
type QueueRunnerOptions<TPayload> = {
    /**
     * BullMQ queue instance to add jobs to.
     * Must implement add(jobName, payload, opts) interface.
     */
    queue: {
        add: (jobName: string, payload: TPayload, opts: any) => Promise<{ id?: string }>;
    };

    /**
     * Job name used for queue processing.
     * Workers filter jobs by this name.
     * Example: "generate-embeddings"
     */
    jobName: string;

    /**
     * Prefix for job IDs to prevent collisions.
     * Format: `${jobIdPrefix}:${entityId}`
     * Example: "resume-embedding" → "resume-embedding:507f1f77bcf86cd799439011"
     */
    jobIdPrefix: string;

    /**
     * Maximum retry attempts on failure.
     * @default 3
     */
    attempts?: number;

    /**
     * Initial backoff delay in milliseconds.
     * Exponential backoff applied: delay, delay*2, delay*4, ...
     * @default 2000
     */
    delay?: number;

    /**
     * Job timeout in milliseconds.
     * Job is marked as failed if not completed within this time.
     * @default 120000 (2 minutes)
     */
    timeout?: number;
};

/**
 * Creates a queue runner function for embedding generation jobs.
 * 
 * **Purpose:**
 * Provides a standardized interface for queuing embedding jobs across all entity types.
 * Handles job configuration (retries, timeouts, backoff) in a reusable way.
 * 
 * **Job ID Pattern:**
 * Uses deterministic job IDs (`${prefix}:${entityId}`) to:
 * - Prevent duplicate jobs for the same entity
 * - Enable job lookup/status checking by entity ID
 * - Support job deduplication in BullMQ
 * 
 * **Error Handling:**
 * - Exponential backoff on failures (2s, 4s, 8s, ...)
 * - Configurable retry attempts (default: 3)
 * - Timeout protection (default: 2 minutes)
 * 
 * **Example Usage:**
 * ```typescript
 * const queueRunner = createEmbeddingQueueRunner({
 *     queue: resumeEmbeddingQueue,
 *     jobName: "generate-embeddings",
 *     jobIdPrefix: "resume-embedding",
 *     attempts: 3,
 *     timeout: 120000
 * });
 * 
 * const { jobId } = await queueRunner({
 *     id: resumeId,
 *     resumeId,
 *     userId
 * });
 * ```
 * 
 * @template TPayload - Type of the job payload (must include { id: string })
 * @param options - Queue runner configuration
 * @returns Async function that queues a job and returns its ID
 */
export const createEmbeddingQueueRunner = <TPayload>({
    queue,
    jobName,
    jobIdPrefix,
    attempts = 3,
    delay = 2000,
    timeout = 120000
}: QueueRunnerOptions<TPayload>) => {
    /**
     * Queue a new embedding generation job.
     * 
     * @param payload - Job payload with entity ID and metadata
     * @returns Promise resolving to { jobId: string }
     * @throws Error if queue.add() fails
     */
    return async (payload: TPayload & { id: string }) => {
        const job = await queue.add(jobName, payload, {
            attempts,
            backoff: { 
                type: 'exponential', 
                delay 
            },
            timeout,
            jobId: `${jobIdPrefix}-${payload.id}`
        });

        return { 
            jobId: job.id!.toString()
        };
    };
};