import { Types }      from 'mongoose';
import * as SkillRepo from '../../repositories/market/skillRepositories.js';
import Skill          from '../../models/market/skillModel.js';
import { CreateSkillPayload, UpdateSkillPayload } from '../../types/skill.types.js';
import { embeddingRegistryV2 } from '../../infrastructure/jobs/domains/embedding/embeddingRegistryV2.js';
import { createEmbeddingServiceFactory } from '../../infrastructure/jobs/factories/createEmbeddingServiceFactory.js';

const skillService = createEmbeddingServiceFactory<
    any,
    CreateSkillPayload,
    UpdateSkillPayload
>({
    entityKey:         'skill',
    label:             'Skill',
    getEmbedding:      SkillRepo.getSkillEmbeddingRepository,
    create:            SkillRepo.createSkillRepository,
    update:            SkillRepo.updateSkillRepository,
    queue:             embeddingRegistryV2.skill.queue,
    buildQueuePayload: (id) => ({ id: id.toString(), skillId: id.toString() }),
    model:             Skill,
    embeddingFields:   ['name'],
    ttlDays:           90,
});

export const getSkillEmbeddingServiceV2     = skillService.getEmbeddingService;
export const enqueueSkillEmbeddingServiceV2 = skillService.enqueueEmbeddingService;
export const upsertSkillEmbeddingServiceV2  = skillService.upsertEmbeddingService;
export const createSkillServiceV2           = skillService.createService;
export const updateSkillServiceV2           = skillService.updateService;