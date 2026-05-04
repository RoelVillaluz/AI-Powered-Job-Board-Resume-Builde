/**
 * Single lookup point for all v2 compute configs.
 * Imported only by executeComputePipelineV2 — never by the registries themselves.
 * This breaks the circular chain:
 *   pipeline → registries (one way only, no back-reference)
 */
export const getComputeConfigV2 = async (entityKey: string) => {
    const { embeddingRegistryV2 } = await import('../domains/embedding/embeddingRegistryV2.js');
    const { scoringRegistryV2 }   = await import('../domains/scoring/scoringRegistryV2.js');

    const registry: Record<string, any> = {
        ...embeddingRegistryV2,
        ...scoringRegistryV2,
    };

    return registry[entityKey] ?? null;
};