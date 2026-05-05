// add to jobTitleController.ts
import { createEmbeddingControllerFactory } from '../../../infrastructure/jobs/factories/createEmbeddingControllerFactory.js';
import {
    getJobTitleEmbeddingServiceV2,
    enqueueJobTitleEmbeddingServiceV2,
} from '../../../services/market/jobTitleServiceV2.js';

const jobTitleEmbeddingControllers = createEmbeddingControllerFactory({
    label:        'Job Title Embedding',
    getEmbedding: getJobTitleEmbeddingServiceV2,
    enqueue:      enqueueJobTitleEmbeddingServiceV2,
});

export const getJobTitleEmbeddingControllerV2      = jobTitleEmbeddingControllers.getEmbeddingController;
export const generateJobTitleEmbeddingControllerV2 = jobTitleEmbeddingControllers.generateEmbeddingController;