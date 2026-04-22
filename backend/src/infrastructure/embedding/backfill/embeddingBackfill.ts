import { Types } from 'mongoose';
import { industryEmbeddingQueue, jobTitleEmbeddingQueue, locationEmbeddingQueue, skillEmbeddingQueue } from '../../../queues/index.js';
import { upsertSkillEmbeddingService } from '../../../services/market/skillService.js';
import { upsertJobTitleEmbeddingService } from '../../../services/market/jobTitleService.js';
import { upsertLocationEmbeddingService } from '../../../services/market/locationService.js';
import { upsertIndustryEmbeddingService } from '../../../services/market/industryService.js';
import logger from '../../../utils/logger.js';
import { safeQueueOperation } from '../../../utils/queueUtils.js';


// --- Types ---
type EntityType = 'skill' | 'jobTitle' | 'location' | 'industry';

type BackfillInput = {
    skillIds?: string[];
    jobTitleId?: string | null;
    locationId?: string | null;
    industryId?: string | null;
};

type BackfillConfig = {
    queue: {
        add: (
            jobName: string,
            payload: Record<string, string>,
            opts: {
                attempts: number;
                backoff: { type: 'exponential'; delay: number };
                jobId: string;
            }
        ) => Promise<unknown>;
    };
    jobName: string;
    jobIdPrefix: string;
    payloadKey: string;
    upsertFn: (id: string) => Promise<unknown>;
};

// --- Config ---

const backfillConfigs: Record<EntityType, BackfillConfig> = {
    skill: {
        queue: skillEmbeddingQueue,
        jobName: 'generate-embeddings',
        jobIdPrefix: 'skill-embedding',
        payloadKey: 'skillId',
        upsertFn: (id: string) =>
            upsertSkillEmbeddingService(new Types.ObjectId(id), true)
    },
    jobTitle: {
        queue: jobTitleEmbeddingQueue,
        jobName: 'generate-embeddings',
        jobIdPrefix: 'job-title-embedding',
        payloadKey: 'titleId',
        upsertFn: (id: string) =>
            upsertJobTitleEmbeddingService(new Types.ObjectId(id), true)
    },
    location: {
        queue: locationEmbeddingQueue,
        jobName: 'generate-embeddings',
        jobIdPrefix: 'location-embedding',
        payloadKey: 'locationId',
        upsertFn: (id: string) =>
            upsertLocationEmbeddingService(new Types.ObjectId(id), true)
    },
    industry: {
        queue: industryEmbeddingQueue,
        jobName: 'generate-embeddings',
        jobIdPrefix: 'industry-embedding',
        payloadKey: 'industryId',
        upsertFn: (id: string) =>
            upsertIndustryEmbeddingService(new Types.ObjectId(id), true)
    }
};

// --- Helpers ---

/**
 * Queues a single backfill job for one entity via safeQueueOperation.
 * Falls back to inline generation if Redis is unavailable.
 */
const queueBackfillJob = (
    entityType: EntityType,
    id: string
): Promise<unknown> => {
    const config = backfillConfigs[entityType];

    if (!config) {
        logger.warn(`No backfill config found for entity type: ${entityType}`);
        return Promise.resolve();
    }

    return safeQueueOperation(
        async () => {
            const job = await config.queue.add(
                config.jobName,
                { [config.payloadKey]: id },
                {
                    attempts: 3,
                    backoff: { type: 'exponential', delay: 2000 },
                    jobId: `${config.jobIdPrefix}-${id}`
                }
            ) as { id?: string }; // 👈 minimal assumption

            return { jobId: job.id ?? `${config.jobIdPrefix}-${id}` };
        },
        () => config.upsertFn(id)
    );
};

// --- Main Function ---

/**
 * Fire-and-forget backfill for entities found in the DB during embedding
 * generation but with null embeddings.
 */
export const triggerEmbeddingBackfill = (
    backfill: BackfillInput | undefined,
    logContext: string
): void => {
    if (!backfill) return;

    const jobs: { entityType: EntityType; id: string }[] = Object.entries(
        backfill
    ).flatMap(([key, value]) => {
        if (!value) return [];

        const entityType = (key.endsWith('Ids')
            ? key.slice(0, -3)
            : key.slice(0, -2)) as EntityType;

        const ids = Array.isArray(value) ? value : [value];
        return ids.map((id) => ({ entityType, id }));
    });

    if (!jobs.length) return;

    Promise.allSettled(
        jobs.map(({ entityType, id }) => queueBackfillJob(entityType, id))
    ).then((results) => {
        const failed = results.filter(
            (r): r is PromiseRejectedResult => r.status === 'rejected'
        );

        if (failed.length) {
            logger.warn(`Backfill queue failures for ${logContext}:`, {
                count: failed.length,
                reasons: failed.map((r) => r.reason?.message)
            });
        }
    });
};