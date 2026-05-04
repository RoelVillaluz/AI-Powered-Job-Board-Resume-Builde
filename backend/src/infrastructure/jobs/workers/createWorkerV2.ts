import { Queue, Worker, Job } from "bullmq";
import { Types } from "mongoose";
import logger from "../../../utils/logger.js";
import { executeComputePipelineV2 } from "../core/executeComputePipelineV2.js";
import { EmitFn } from "../core/computeRegistryTypesV2.js";
import { getIO } from "../../../sockets/index.js";
import { getSocketId } from "../../../sockets/presence.js";

interface WorkerConfig {
    entityKey: string;
    queue: Queue;
    concurrency?: number;
    connection: any;
    dlq?: Queue | null;
}

interface ComputeJobData {
    id: string;
    userId?: string;
}

export const createWorkerV2 = ({
    entityKey,
    queue,
    concurrency = 5,
    connection,
    dlq = null,
}: WorkerConfig): Worker => {

    const processor = async (job: Job<ComputeJobData>) => {
        const { id, userId } = job.data;

        if (!id) throw new Error(`Missing job id for ${entityKey}`);

        const logCtx = `${entityKey}:${id}`;

        logger.info(`[WORKER V2 START] ${logCtx}`);

        // ─────────────────────────────────────────
        // Socket emitter (best-effort)
        // ─────────────────────────────────────────
        const emitSocket = (event: string, data: any) => {
            if (!userId) return;

            try {
                const socketId = getSocketId(userId);
                const io = getIO();

                if (socketId && io) {
                    io.to(socketId).emit(event, data);
                }
            } catch {}
        };

        // ─────────────────────────────────────────
        // Unified progress emitter
        // ─────────────────────────────────────────
        const emit: EmitFn = (event, data) => {
            try { job.updateProgress(data.progress); } catch {}
            emitSocket(event, data);
        };

        // ─────────────────────────────────────────
        // PIPELINE EXECUTION
        // ─────────────────────────────────────────
        const result = await executeComputePipelineV2({
            entityKey,
            id: new Types.ObjectId(id),
            job,
            emit,
        });

        logger.info(`[WORKER V2 SUCCESS] ${logCtx}`);

        return result;
    };

    const worker = new Worker(queue.name, processor, {
        connection,
        concurrency,
        limiter: {
            max: concurrency * 2,
            duration: 1000,
        },
    });

    // ─────────────────────────────────────────
    // Lifecycle logs
    // ─────────────────────────────────────────
    worker.on("ready", () =>
        logger.info(`[WORKER V2 READY] ${entityKey}`)
    );

    worker.on("active", (job) =>
        logger.info(`[WORKER V2 ACTIVE] ${entityKey}:${job.data.id}`, {
            jobId: job.id,
        })
    );

    worker.on("completed", (job) =>
        logger.info(`[WORKER V2 COMPLETED] ${entityKey}:${job.data.id}`, {
            jobId: job.id,
            duration: job.finishedOn
                ? job.finishedOn - job.processedOn!
                : 0,
        })
    );

    worker.on("failed", async (job, error) => {
        logger.error(`[WORKER V2 FAILED] ${entityKey}`, {
            jobId: job?.id,
            error: error.message,
        });

        // optional DLQ handling
        if (
            dlq &&
            job &&
            job.attemptsMade >= (job.opts.attempts ?? 3)
        ) {
            try {
                await dlq.add("dead-letter", {
                    originalJobId: job.id,
                    queue: job.queueName,
                    payload: job.data,
                    error: error.message,
                    failedAt: new Date().toISOString(),
                });
            } catch (e) {
                logger.error(`[DLQ ERROR]`, e);
            }
        }
    });

    worker.on("error", (err) =>
        logger.error(`[WORKER V2 ERROR] ${entityKey}`, {
            error: err.message,
        })
    );

    worker.on("stalled", (jobId) =>
        logger.warn(`[WORKER V2 STALLED] ${entityKey}`, { jobId })
    );

    logger.info(`[WORKER V2 STARTED] ${entityKey}`, {
        queue: queue.name,
        concurrency,
    });

    return worker;
};