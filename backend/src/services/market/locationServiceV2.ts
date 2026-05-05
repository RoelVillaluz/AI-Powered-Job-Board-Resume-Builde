import * as LocationRepo from '../../repositories/market/locationRepositories.js';
import Location          from '../../models/market/locationModel.js';
import { CreateLocationPayload, UpdateLocationPayload } from '../../types/location.types.js';
import { embeddingRegistryV2 } from '../../infrastructure/jobs/domains/embedding/embeddingRegistryV2.js';
import { createEmbeddingServiceFactory } from '../../infrastructure/jobs/factories/createEmbeddingServiceFactory.js';

const locationService = createEmbeddingServiceFactory<
    any,
    CreateLocationPayload,
    UpdateLocationPayload
>({
    entityKey:         'location',
    label:             'Location',
    getEmbedding:      (id) => LocationRepo.getLocationEmbeddingByIdRepository(id),
    create:            (data) => LocationRepo.createLocationRepository(data),
    update:            (id, data) => LocationRepo.updateLocationRepository(id, data),
    queue:             embeddingRegistryV2.location.queue,
    buildQueuePayload: (id) => ({ id: id.toString(), locationId: id.toString() }),
    model:             Location,
    embeddingFields:   ['name'],
    ttlDays:           90,
});
 
export const getLocationEmbeddingServiceV2     = locationService.getEmbeddingService;
export const enqueueLocationEmbeddingServiceV2 = locationService.enqueueEmbeddingService;
export const upsertLocationEmbeddingServiceV2  = locationService.upsertEmbeddingService;
export const createLocationServiceV2           = locationService.createService;
export const updateLocationServiceV2           = locationService.updateService;