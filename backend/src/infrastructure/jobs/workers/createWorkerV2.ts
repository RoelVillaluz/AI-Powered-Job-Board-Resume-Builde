import { Queue, Worker, Job } from 'bullmq';
import { Types } from 'mongoose';
import logger from '../../../utils/logger.js';
import { executeComputePipelineV2 } from '../core/executeComputePipelineV2.js';
import { ComputeConfigV2, EmitFn } from '../core/computeRegistryTypesV2.js';
import { getSocketId } from '../../../sockets/presence.js';
import { getIO } from '../../../sockets/index.js';

interface WorkerV2Config {
    config:      ComputeConfigV2<any, any>;  // registry entry passed in directly
    queue:       Queue;
    connection:  any;
    dlq?:        Queue | null;
}

const moveToDLQ = async (dlq: Queue, job: Job, err: Error) => {
    try {
        await dlq.add('dead-letter', {
            originalJobId: job.id,
            originalQueue: job.queueName,
            payload:       job.data,
            failedReason:  err.message,
            failedAt:      new Date().toISOString(),
            attemptsMade:  job.attemptsMade,
        }, {
            removeOnComplete: { age: 30 * 24 * 3600 },
            removeOnFail:     true,
        });
    } catch (dlqError) {
        logger.error('[WORKER V2 DLQ] Failed to write', {
            originalJobId: job.id,
            error:         (dlqError as Error).message,
        });
    }
};

export const createWorkerV2 = ({
    config,
    queue,
    connection,
    dlq = null,
}: WorkerV2Config): Worker => {

    const key = config.key;

    const processor = async (job: Job) => {
        const id     = job.data.id ?? job.data.resumeId ?? job.data.skillId;
        const userId = job.data.userId;
        const logCtx = `${key}:${id}`;

        if (!id) throw new Error(`Missing id in job data for ${key}`);

        logger.info(`[WORKER V2 START] ${logCtx}`, {
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

        const emit: EmitFn = (event, data) => {
            try { job.updateProgress(data.progress); } catch { /* best-effort */ }
            emitSocket(event, data);
        };

        const result = await executeComputePipelineV2({
            config,      // ← pass config directly, no registry lookup inside pipeline
            id:          new Types.ObjectId(id),
            job,
            emit,
            emitSocket,
        });

        logger.info(`[WORKER V2 SUCCESS] ${logCtx}`, {
            jobId:    job.id,
            duration: Date.now() - job.timestamp,
        });

        return result;
    };

    const worker = new Worker(queue.name, processor, {
        connection,
        concurrency: config.concurrency,
        limiter: { max: config.concurrency * 2, duration: 1000 },
    });

    worker.on('ready',     ()         => logger.info(`[WORKER V2 READY] ${key}`));
    worker.on('active',    (job)      => logger.info(`[WORKER V2 ACTIVE] ${key}:${job.data.id ?? job.data.resumeId}`));
    worker.on('completed', (job)      => logger.info(`[WORKER V2 COMPLETED] ${key}`, { jobId: job.id }));
    worker.on('failed',    async (job, err) => {
        logger.error(`[WORKER V2 FAILED] ${key}`, {
            jobId:     job?.id,
            attempt:   job?.attemptsMade,
            error:     err.message,
            willRetry: job && job.attemptsMade < (job.opts.attempts ?? 1),
        });
        if (dlq && job && job.attemptsMade >= (job.opts.attempts ?? 3)) {
            await moveToDLQ(dlq, job, err);
        }
    });
    worker.on('error',   (err)    => logger.error(`[WORKER V2 ERROR] ${key}`, { error: err.message }));
    worker.on('stalled', (jobId)  => logger.warn(`[WORKER V2 STALLED] ${key}`, { jobId }));

    logger.info(`[WORKER V2 STARTED] ${key}`, {
        queue:       queue.name,
        concurrency: config.concurrency,
        dlq:         dlq?.name ?? 'none',
    });

    return worker;
};