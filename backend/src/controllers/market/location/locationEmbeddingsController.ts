import { getLocationEmbeddingServiceV2, enqueueLocationEmbeddingServiceV2 } from "../../../services/market/locationServiceV2";
import { createEmbeddingControllerFactory } from "../../../infrastructure/jobs/factories/createEmbeddingControllerFactory";

const locationEmbeddingControllers = createEmbeddingControllerFactory({
    label: 'Location Embedding',
    getEmbedding: getLocationEmbeddingServiceV2,
    enqueue: enqueueLocationEmbeddingServiceV2
})

export const getLocationEmbeddingControllerV2 = locationEmbeddingControllers.getEmbeddingController;
export const generateLocationEmbeddingControllerV2 = locationEmbeddingControllers.generateEmbeddingController;