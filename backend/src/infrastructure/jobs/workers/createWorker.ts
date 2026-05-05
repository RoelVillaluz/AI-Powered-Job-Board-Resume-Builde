import { Queue, Worker, Job } from 'bullmq';
import { Types } from 'mongoose';
import logger from '../../../utils/logger.js';
import { executeComputePipelineV2 } from '../core/executeComputePipelineV2.js';
import { ComputeJobConfig } from '../core/computeRegistryTypes.js';
import { getIO } from '../../../sockets/index.js';
import { getSocketId } from '../../../sockets/presence.js';

interface WorkerConfig {
    entityKey:   string;
    config:      ComputeJobConfig<any, any>;  // ← passed in, not looked up
    queue:       Queue;
    jobName:     string;
    concurrency?: number;
    connection:  {
        host?:     string;
        port?:     number;
        password?: string;
        url?:      string;
    };
    dlq?: Queue | null;
}

interface ComputeJobData {
    id:               string;
    invalidateCache?: boolean;
    [key: string]:    any;
}

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
                removeOnFail:     true,
            }
        );
    } catch (dlqError) {
        logger.error('[WORKER DLQ] Failed to write to DLQ', {
            originalJobId: job.id,
            queue:         job.queueName,
            error:         (dlqError as Error).message,
        });
    }
};

export const createWorker = ({
    entityKey,
    config,     // ← no more registry lookup
    queue,
    jobName,
    concurrency = 5,
    connection,
    dlq = null,
}: WorkerConfig): Worker => {

    if (!config) throw new Error(`No config provided for entity: ${entityKey}`);

    const processor = async (job: Job<ComputeJobData>) => {
        const { id, userId, invalidateCache = false } = job.data;
        const logCtx = `${entityKey}:${id}`;

        if (!id) throw new Error(`Missing 'id' in job data for ${entityKey}`);

        logger.info(`[WORKER START] ${logCtx}`, {
            jobId:   job.id,
            userId:  userId ?? 'none',
            attempt: job.attemptsMade + 1,
        });

        const emitSocket = (event: string, data: object) => {
            if (!userId) return;
            try {
                const socketId = getSocketId(userId);
                const io       = getIO();
                if (socketId && io) io.to(socketId).emit(event, data);
            } catch { /* best-effort */ }
        };

        const emit = (event: string, data: { progress: number; message?: string }) => {
            try { job.updateProgress(data.progress); } catch { /* best-effort */ }
            emitSocket(event, data);
        };

        const result = await executeComputePipelineV2({
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

    const worker = new Worker(queue.name, processor, {
        connection,
        concurrency,
        limiter: { max: concurrency * 2, duration: 1000 },
    });

    worker.on('ready',     ()          => logger.info(`[WORKER READY] ${entityKey} worker listening`));
    worker.on('active',    (job)       => logger.info(`[WORKER ACTIVE] ${entityKey}:${job.data.id}`, { jobId: job.id }));
    worker.on('completed', (job)       => logger.info(`[WORKER COMPLETED] ${entityKey}:${job.data.id}`, {
        jobId:    job.id,
        duration: job.finishedOn ? job.finishedOn - job.processedOn! : 0,
    }));
    worker.on('failed',    async (job, error) => {
        logger.error(`[WORKER FAILED] ${entityKey}:${job?.data?.id}`, {
            jobId:       job?.id,
            attempt:     job?.attemptsMade,
            maxAttempts: job?.opts.attempts,
            error:       error.message,
            willRetry:   job && job.attemptsMade < (job.opts.attempts ?? 1),
        });
        if (dlq && job && job.attemptsMade >= (job.opts.attempts ?? 3)) {
            await moveToDLQ(dlq, job, error);
        }
    });
    worker.on('error',   (error)  => logger.error(`[WORKER ERROR] ${entityKey}`, { error: error.message }));
    worker.on('stalled', (jobId)  => logger.warn(`[WORKER STALLED] ${entityKey}`, { jobId }));

    logger.info(`[WORKER STARTED] ${entityKey} initialized`, {
        queue:       queue.name,
        concurrency,
        dlq:         dlq?.name ?? 'none',
    });

    return worker;
};