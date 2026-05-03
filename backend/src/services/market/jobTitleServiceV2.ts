import * as JobTitleRepo from '../../repositories/market/jobTitleRepositories.js';
import JobTitle          from '../../models/market/jobTitleModel.js';
import { CreateJobTitlePayload, UpdateJobTitlePayload } from '../../types/jobTitle.types.js';
import { ImportanceLevel } from '../../../../shared/constants/jobsAndIndustries/constants.js';
import { embeddingRegistryV2 } from '../../infrastructure/jobs/domains/embedding/embeddingRegistryV2.js';
import { createEmbeddingServiceFactory } from '../../infrastructure/jobs/factories/createEmbeddingServiceFactory.js';
import { Types } from 'mongoose';

const jobTitleService = createEmbeddingServiceFactory<
    any,
    CreateJobTitlePayload,
    UpdateJobTitlePayload
>({
    entityKey:         'jobTitle',
    label:             'JobTitle',
    getEmbedding:      (id) => JobTitleRepo.getJobTitleEmbeddingsByIdRepository(id),
    create:            (data) => JobTitleRepo.createJobTitleRepository(data),
    update:            (id, data) => JobTitleRepo.updateJobTitleRepository(id, data),
    queue:             embeddingRegistryV2.jobTitle.queue,
    buildQueuePayload: (id) => ({ id: id.toString(), titleId: id.toString() }),
    model:             JobTitle,
    embeddingFields:   ['title', 'normalizedTitle'],
    ttlDays:           90,
});
 
export const getJobTitleEmbeddingServiceV2     = jobTitleService.getEmbeddingService;
export const enqueueJobTitleEmbeddingServiceV2 = jobTitleService.enqueueEmbeddingService;
export const upsertJobTitleEmbeddingServiceV2  = jobTitleService.upsertEmbeddingService;
export const createJobTitleServiceV2           = jobTitleService.createService;
export const updateJobTitleServiceV2           = jobTitleService.updateService;

// ── Query not covered by factory ──────────────────────────────────────────────

export const getJobTitleTopSkillsServiceV2 = async (
    id: Types.ObjectId,
    importance: string | null,
) => {
    if (importance) {
        const lower = importance.toLowerCase() as ImportanceLevel;
        if (!Object.values(ImportanceLevel).includes(lower)) {
            throw new Error(`Invalid importance level: ${importance}`);
        }
        return JobTitleRepo.getJobTitleTopSkillsByImportance(id, lower);
    }
    return JobTitleRepo.getJobTitleTopSkillsByImportance(id, null);
};