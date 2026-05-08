import { Types }      from 'mongoose';
import * as SkillRepo from '../../repositories/market/skillRepositories.js';
import Skill          from '../../models/market/skillModel.js';
import { CreateSkillPayload, UpdateSkillPayload } from '../../types/skill.types.js';
import { createEmbeddingServiceFactory } from '../../infrastructure/jobs/factories/createEmbeddingServiceFactory.js';

// ─── Factory ──────────────────────────────────────────────────────────────────
// embeddingRegistryV2 is NOT imported here — the factory resolves it lazily
// to avoid the circular chain: service → factory → registry → service

const skillService = createEmbeddingServiceFactory<
    any,
    CreateSkillPayload,
    UpdateSkillPayload
>({
    entityKey: 'skill',
    label:     'Skill',

    getEmbedding: (id) => SkillRepo.getSkillEmbeddingRepository(id),
    create:       (data) => SkillRepo.createSkillRepository(data),
    update:       (id, data) => SkillRepo.updateSkillRepository(id, data),

    buildQueuePayload: (id) => ({
        id:      id.toString(),
        skillId: id.toString(),
    }),

    model:           Skill,
    embeddingFields: ['name'],
    ttlDays:         90,
});

// ─── Exports ──────────────────────────────────────────────────────────────────

export const getSkillEmbeddingServiceV2     = skillService.getEmbeddingService;
export const enqueueSkillEmbeddingServiceV2 = skillService.enqueueEmbeddingService;
export const upsertSkillEmbeddingServiceV2  = skillService.upsertEmbeddingService;
export const createSkillServiceV2           = skillService.createService;
export const updateSkillServiceV2           = skillService.updateService;