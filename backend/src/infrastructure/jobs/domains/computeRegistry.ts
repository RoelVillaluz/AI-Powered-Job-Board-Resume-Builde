import { embeddingRegistry } from '../domains/embedding/embeddingRegistry.js';
import { scoringRegistry }   from '../domains/scoring/scoringRegistry.js';
import { ComputeJobConfig }  from '../core/computeRegistryTypes.js';

export const computeRegistry: Record<string, ComputeJobConfig<any, any>> = {
    ...embeddingRegistry,
    ...scoringRegistry,
};