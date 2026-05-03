import * as IndustryRepo from '../../repositories/market/industryRepositories.js';
import Industry          from '../../models/market/industryModel.js';
import { CreateIndustryPayload, UpdateIndustryPayload } from '../../types/industry.types.js';
import { embeddingRegistryV2 } from '../../infrastructure/jobs/domains/embedding/embeddingRegistryV2.js';
import { createEmbeddingServiceFactory } from '../../infrastructure/jobs/factories/createEmbeddingServiceFactory.js';

const industryService = createEmbeddingServiceFactory<
    any,
    CreateIndustryPayload,
    UpdateIndustryPayload
>({
    entityKey:         'industry',
    label:             'Industry',
    getEmbedding:      (id) => IndustryRepo.getIndustryEmbeddingByIdRepository(id),
    create:            (data) => IndustryRepo.createIndustryRepository(data),
    update:            (id, data) => IndustryRepo.updateIndustryRepository(id, data),
    queue:             embeddingRegistryV2.industry.queue,
    buildQueuePayload: (id) => ({ id: id.toString(), industryId: id.toString() }),
    model:             Industry,
    embeddingFields:   ['name'],
    ttlDays:           90,
});
 
export const getIndustryEmbeddingServiceV2     = industryService.getEmbeddingService;
export const enqueueIndustryEmbeddingServiceV2 = industryService.enqueueEmbeddingService;
export const upsertIndustryEmbeddingServiceV2  = industryService.upsertEmbeddingService;
export const createIndustryServiceV2           = industryService.createService;
export const updateIndustryServiceV2           = industryService.updateService;