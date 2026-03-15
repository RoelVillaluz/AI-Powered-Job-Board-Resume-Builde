import { Request, Response } from "express";
import * as SkillService from '../../services/market/skillService';
import * as SkillRepo from '../../repositories/market/skillRepositories';
import { catchAsync } from '../../utils/errorUtils';
import { sendResponse, STATUS_MESSAGES } from '../../constants';
import { Types } from "mongoose";

// ============================================
// READ
// ============================================

/**
 * GET /skills/search/:name
 * Search skills by partial name — used for autocomplete dropdowns.
 * Returns max 10 results with only _id and name fields.
 */
export const getSkillsByName = catchAsync(async (req: Request, res: Response) => {
    const { name } = req.params as { name: string };

    const skills = await SkillRepo.getSkillsByNameRepository(name);

    return sendResponse(res, { ...STATUS_MESSAGES.SUCCESS.FETCH, data: skills } as any, 'Skills');
});

/**
 * GET /skills/:id
 * Fetch a single skill with all market fields by ObjectId.
 * Used for skill detail pages or admin views.
 */
export const getSkillById = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };

    const skill = await SkillRepo.getSkillByIdRepository(new Types.ObjectId(id));

    if (!skill) {
        return sendResponse(res, { ...STATUS_MESSAGES.ERROR.NOT_FOUND } as any, 'Skill');
    }

    return sendResponse(res, { ...STATUS_MESSAGES.SUCCESS.FETCH, data: skill } as any, 'Skill');
});

/**
 * GET /skills/:id/metrics
 * Fetch only core market metrics for a skill.
 * Used by the AI pipeline and salary prediction features.
 */
export const getSkillMetrics = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };

    const skill = await SkillRepo.getSkillMetricsRepository(new Types.ObjectId(id));

    if (!skill) {
        return sendResponse(res, { ...STATUS_MESSAGES.ERROR.NOT_FOUND } as any, 'Skill');
    }

    return sendResponse(res, { ...STATUS_MESSAGES.SUCCESS.FETCH, data: skill } as any, 'Skill');
});

// ============================================
// CREATE
// ============================================

/**
 * POST /skills
 * Create a new skill and queue embedding generation as a background job.
 * Only accepts { name } — all metrics are computed by the AI pipeline later.
 */
export const createSkill = catchAsync(async (req: Request, res: Response) => {
    const skill = await SkillService.createSkillService(req.body);

    return sendResponse(res, { ...STATUS_MESSAGES.SUCCESS.CREATE,    data: skill } as any, 'Skill');
});

// ============================================
// UPDATE
// ============================================

/**
 * PATCH /skills/:id
 * Update user-editable fields of a skill.
 * If name is changed, invalidates the existing embedding and queues regeneration
 * since the semantic meaning of the skill has changed.
 */
export const updateSkill = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };

    const skill = await SkillService.updateSkillService(new Types.ObjectId(id), req.body);

    // Move 404 validation check to service
    if (!skill) {
        return sendResponse(res, { ...STATUS_MESSAGES.ERROR.NOT_FOUND } as any, 'Skill');
    }

    return sendResponse(res, { ...STATUS_MESSAGES.SUCCESS.UPDATE, data: skill } as any, 'Skill');
});

// ============================================
// DELETE
// ============================================

/**
 * DELETE /skills/:id
 * Hard delete a skill document.
 * Skills are market data — no soft delete needed.
 */
export const deleteSkill = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };

    const skill = await SkillRepo.deleteSkillRepository(new Types.ObjectId(id));

    if (!skill) {
        return sendResponse(res, { ...STATUS_MESSAGES.ERROR.NOT_FOUND } as any, 'Skill');
    }

    return sendResponse(res, { ...STATUS_MESSAGES.SUCCESS.DELETE, data: null } as any, 'Skill');
});

// ============================================
// EMBEDDING
// ============================================

/**
 * GET /skills/:id/embeddings
 * Trigger embedding generation or return cached embedding for a skill.
 * Routes through the orchestrator — never calls Python directly.
 * Returns jobId if queued, or cached data if valid embedding exists.
 */
export const getOrGenerateSkillEmbedding = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };
    const { invalidateCache = false } = req.body;

    const result = await SkillService.getOrGenerateSkillEmbeddingService(
        new Types.ObjectId(id),
        invalidateCache
    );

    if (result.cached) {
        return sendResponse(res, {
            ...STATUS_MESSAGES.SUCCESS.FETCH,
            cached: true,
            data: result.data
        } as any, 'Skill Embedding');
    }

    return res.status(202).json({
        success: true,
        cached: false,
        message: 'Embedding generation queued',
        jobId: result.jobId,
        statusUrl: `/api/jobs/${result.jobId}/status`
    });
});