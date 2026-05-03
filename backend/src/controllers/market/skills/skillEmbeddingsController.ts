// add to skillController.ts
import { createEmbeddingControllerFactory } from '../../../infrastructure/jobs/factories/createEmbeddingControllerFactory.js';
import {
    getSkillEmbeddingServiceV2,
    enqueueSkillEmbeddingServiceV2,
} from '../../../services/market/skillServiceV2.js';

const skillEmbeddingControllers = createEmbeddingControllerFactory({
    label:        'Skill Embedding',
    getEmbedding: getSkillEmbeddingServiceV2,
    enqueue:      enqueueSkillEmbeddingServiceV2,
});

export const getSkillEmbeddingControllerV2      = skillEmbeddingControllers.getEmbeddingController;
export const generateSkillEmbeddingControllerV2 = skillEmbeddingControllers.generateEmbeddingController;