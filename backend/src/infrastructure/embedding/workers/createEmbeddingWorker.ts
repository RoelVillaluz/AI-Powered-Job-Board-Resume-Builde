import { Queue, Worker, Job } from 'bullmq';
import { Types } from 'mongoose';
import logger from '../../../utils/logger';
import { embeddingRegistry } from '../registry/embeddingRegistry';
import { executeEmbeddingPipeline } from '../core/executeEmbeddingPipeline';
import { EmbeddingEntityKey } from '../registry/embeddingRegistry.types.js';
import { getIO } from '../../../sockets';
import { getSocketId } from '../../../sockets/presence';

interface WorkerConfig {
    entityKey: EmbeddingEntityKey;
    queue: Queue;
    jobName: string;
    concurrency?: number;
    connection: {
        host?: string;
        port?: number;
        password?: string;
        url?: string;
    };
    /**
     * Optional DLQ instance. When provided, exhausted jobs are moved here
     * automatically — no per-entity event handler needed.
     */
    dlq?: Queue | null;
}

interface EmbeddingJobData {
    id: string;
    invalidateCache?: boolean;
    [key: string]: any;
}

/**
 * Moves an exhausted job into its dead letter queue.
 * Private to this module — callers never touch it directly.
 */
const moveToDLQ = async (dlq: Queue, job: Job, err: Error): Promise<void> => {
    try {
        await dlq.add(
            'dead-letter',
            {
                originalJobId: job.id,
                originalQueue: job.queueName,
                payload:       job.data,
                failedReason:  err.message,
                failedAt:      new Date().toISOString(),
                attemptsMade:  job.attemptsMade,
            },
            {
                removeOnComplete: { age: 30 * 24 * 3600 },
                removeOnFail: true,
            }
        );
    } catch (dlqError) {
        // DLQ write must never throw — log and continue
        logger.error('[WORKER DLQ] Failed to write to DLQ', {
            originalJobId: job.id,
            queue:         job.queueName,
            error:         (dlqError as Error).message,
        });
    }
};

/**
 * Creates a generic BullMQ worker for any embedding entity.
 * Reads pipeline behaviour from embeddingRegistry[entityKey].
 * DLQ handling is built-in — pass dlq: null to opt out.
 */
export const createEmbeddingWorker = ({
    entityKey,
    queue,
    jobName,
    concurrency = 5,
    connection,
    dlq = null,
}: WorkerConfig): Worker => {

    const entityConfig = embeddingRegistry[entityKey];

    if (!entityConfig) {
        throw new Error(`No registry config found for entity: ${entityKey}`);
    }

    // ─── Processor ────────────────────────────────────────────────────────────
    const processor = async (job: Job<EmbeddingJobData>) => {
        const { id, userId, invalidateCache = false } = job.data;
        const logCtx = `${entityKey}:${id}`;

        if (!id) throw new Error(`Missing 'id' in job data for ${entityKey}`);

        logger.info(`[WORKER START] ${logCtx}`, {
            jobId:   job.id,
            userId:  userId ?? 'none',
            attempt: job.attemptsMade + 1,
        });

        // Socket emitter — no-ops if userId missing or socket unavailable
        const emitSocket = (event: string, data: object) => {
            if (!userId) return;
            try {
                const socketId = getSocketId(userId);
                const io = getIO();
                if (socketId && io) io.to(socketId).emit(event, data);
            } catch { /* best-effort */ }
        };

        // Receives (event, { progress, message }) directly from runPython's stdout parser
        // Updates BullMQ progress and forwards the event as-is to the socket
        const emit = (event: string, data: { progress: number; message?: string }) => {
            try { job.updateProgress(data.progress); } catch { /* best-effort */ }
            emitSocket(event, data);  // event is "embedding:progress" or "score:progress"
        };

        const result = await executeEmbeddingPipeline({
            entityKey,
            id: new Types.ObjectId(id),
            job,
            emit,
            emitSocket,
        });

        logger.info(`[WORKER SUCCESS] ${logCtx}`, {
            jobId:    job.id,
            duration: Date.now() - job.timestamp,
        });

        return result;
    };

    // ─── Worker ───────────────────────────────────────────────────────────────

    const worker = new Worker(queue.name, processor, {
        connection,
        concurrency,
        limiter: {
            max:      concurrency * 2,
            duration: 1000,
        },
    });

    // ─── Events ───────────────────────────────────────────────────────────────

    worker.on('ready', () => {
        logger.info(`[WORKER READY] ${entityKey} worker listening`);
    });

    worker.on('active', (job) => {
        logger.info(`[WORKER ACTIVE] ${entityKey}:${job.data.id}`, { jobId: job.id });
    });

    worker.on('completed', (job) => {
        logger.info(`[WORKER COMPLETED] ${entityKey}:${job.data.id}`, {
            jobId:    job.id,
            duration: job.finishedOn ? job.finishedOn - job.processedOn! : 0,
        });
    });

    worker.on('failed', async (job, error) => {
        logger.error(`[WORKER FAILED] ${entityKey}:${job?.data?.id}`, {
            jobId:       job?.id,
            attempt:     job?.attemptsMade,
            maxAttempts: job?.opts.attempts,
            error:       error.message,
            willRetry:   job && job.attemptsMade < (job.opts.attempts ?? 1),
        });

        if (dlq && job && job.attemptsMade >= (job.opts.attempts ?? 3)) {
            logger.warn(`[WORKER DLQ] ${entityKey} exhausted retries — moving to DLQ`, {
                jobId: job.id,
            });
            await moveToDLQ(dlq, job, error);
        }
    });

    worker.on('error', (error) => {
        logger.error(`[WORKER ERROR] ${entityKey} worker connection error`, {
            error: error.message,
            stack: error.stack,
        });
    });

    worker.on('stalled', (jobId) => {
        logger.warn(`[WORKER STALLED] ${entityKey}`, { jobId });
    });

    logger.info(`[WORKER STARTED] ${entityKey} initialized`, {
        queue:       queue.name,
        concurrency,
        dlq:         dlq?.name ?? 'none',
    });

    return worker;
};