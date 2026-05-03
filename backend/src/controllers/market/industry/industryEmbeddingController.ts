// add to industryController.ts
import { createEmbeddingControllerFactory } from '../../../infrastructure/jobs/factories/createEmbeddingControllerFactory.js';
import {
    getIndustryEmbeddingServiceV2,
    enqueueIndustryEmbeddingServiceV2,
} from '../../../services/market/industryServiceV2.js';

const industryEmbeddingControllers = createEmbeddingControllerFactory({
    label:        'Industry Embedding',
    getEmbedding: getIndustryEmbeddingServiceV2,
    enqueue:      enqueueIndustryEmbeddingServiceV2,
});

export const getIndustryEmbeddingControllerV2      = industryEmbeddingControllers.getEmbeddingController;
export const generateIndustryEmbeddingControllerV2 = industryEmbeddingControllers.generateEmbeddingController;