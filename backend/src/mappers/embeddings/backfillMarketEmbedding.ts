/**
 * Helper: backfillMarketEmbeddings
 *
 * Writes newly-generated embedding vectors back to the market collection
 * documents that had null embeddings when the Python pipeline ran.
 *
 * WHAT THIS DOES:
 *   - Receives backfill candidates from the Python embedding result
 *   - Writes vectors back to Skill, JobTitle, and Location documents
 *   - Runs all writes in parallel — independent collections, no ordering needed
 *   - Skips gracefully if there is nothing to backfill
 *
 * WHAT THIS DOES NOT DO:
 *   - No embedding generation (Python's job)
 *   - No resume/job embedding persistence (separate upsert repo)
 *   - No retries — if a backfill write fails it logs and moves on so one
 *     bad market doc never blocks the primary embedding result
 *
 * Called by: mapResumeEmbeddingResult / mapJobPostingEmbeddingResult
 * after the Python response is received and before the main persist step.
 */

import { Types } from "mongoose";
import Skill     from "../../models/market/skillModel.js";
import JobTitle  from "../../models/market/jobTitleModel.js";
import Location  from "../../models/market/locationModel.js";
import logger    from "../../utils/logger.js";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface BackfillCandidates {
    skillIdsToBackfill:       string[];
    skillEmbeddingsToBackfill: number[][];   // parallel to skillIdsToBackfill
    jobTitleIdToBackfill?:    string | null;
    jobTitleEmbedding?:       number[] | null;
    locationIdToBackfill?:    string | null;
    locationEmbedding?:       number[] | null;
}

// ── Main ──────────────────────────────────────────────────────────────────────

export const backfillMarketEmbeddings = async (
    candidates: BackfillCandidates,
): Promise<void> => {
    const tasks: Promise<void>[] = [];

    // ── Skills ────────────────────────────────────────────────────────────────
    const { skillIdsToBackfill, skillEmbeddingsToBackfill } = candidates;

    if (skillIdsToBackfill.length > 0) {
        if (skillIdsToBackfill.length !== skillEmbeddingsToBackfill.length) {
            logger.warn(
                `[backfillMarketEmbeddings] Skill ID/embedding count mismatch — ` +
                `ids: ${skillIdsToBackfill.length}, embeddings: ${skillEmbeddingsToBackfill.length}. Skipping skills.`
            );
        } else {
            for (let i = 0; i < skillIdsToBackfill.length; i++) {
                const id        = skillIdsToBackfill[i];
                const embedding = skillEmbeddingsToBackfill[i];

                tasks.push(
                    Skill.findByIdAndUpdate(
                        new Types.ObjectId(id),
                        { $set: { embedding, embeddingGeneratedAt: new Date() } },
                    )
                    .then(() => {
                        logger.info(`[backfillMarketEmbeddings] Skill backfilled: ${id}`);
                    })
                    .catch(err => {
                        logger.error(`[backfillMarketEmbeddings] Skill backfill failed: ${id}`, err);
                    })
                );
            }
        }
    }

    // ── Job title ─────────────────────────────────────────────────────────────
    const { jobTitleIdToBackfill, jobTitleEmbedding } = candidates;

    if (jobTitleIdToBackfill && jobTitleEmbedding?.length) {
        tasks.push(
            JobTitle.findByIdAndUpdate(
                new Types.ObjectId(jobTitleIdToBackfill),
                { $set: { embedding: jobTitleEmbedding, embeddingGeneratedAt: new Date() } },
            )
            .then(() => {
                logger.info(`[backfillMarketEmbeddings] JobTitle backfilled: ${jobTitleIdToBackfill}`);
            })
            .catch(err => {
                logger.error(`[backfillMarketEmbeddings] JobTitle backfill failed: ${jobTitleIdToBackfill}`, err);
            })
        );
    }

    // ── Location ──────────────────────────────────────────────────────────────
    const { locationIdToBackfill, locationEmbedding } = candidates;

    if (locationIdToBackfill && locationEmbedding?.length) {
        tasks.push(
            Location.findByIdAndUpdate(
                new Types.ObjectId(locationIdToBackfill),
                { $set: { embedding: locationEmbedding, embeddingGeneratedAt: new Date() } },
            )
            .then(() => {
                logger.info(`[backfillMarketEmbeddings] Location backfilled: ${locationIdToBackfill}`);
            })
            .catch(err => {
                logger.error(`[backfillMarketEmbeddings] Location backfill failed: ${locationIdToBackfill}`, err);
            })
        );
    }

    if (tasks.length === 0) {
        return;
    }

    logger.info(`[backfillMarketEmbeddings] Running ${tasks.length} backfill write(s)`);
    await Promise.all(tasks);
};