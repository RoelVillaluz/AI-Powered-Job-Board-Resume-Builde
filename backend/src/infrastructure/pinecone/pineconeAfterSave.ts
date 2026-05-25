import logger from '../../utils/logger.js';
import { ResumeEmbeddingsDocument, JobPostingEmbeddingsDocument } from '../../types/embeddings.types.js';

/**
 * Handles Pinecone upsert after a resume embedding is saved to MongoDB.
 * Threshold-gated and non-fatal — never breaks the embedding pipeline.
 *
 * Called from embeddingRegistryV2 resume.afterSave
 */
export const handleResumeVectorUpsert = async (
    saved: ResumeEmbeddingsDocument,
    userId: string | null,
    bypassThreshold = false,   // ← reconciliation passes true
): Promise<void> => {
    try {
        if (!bypassThreshold) {
            const { shouldUsePinecone } = await import('./pineconeThreshold.js');
            if (!await shouldUsePinecone()) {
                logger.info(`[Pinecone] Below threshold — skipping resume upsert: ${saved.resume}`);
                return;
            }
        }

        const Resume = (await import('../../models/resumes/resumeModel.js')).default;
        const resume = await Resume.findById(saved.resume).lean();
        if (!resume) {
            logger.warn(`[PINECONE] resume not found for upsert: ${saved.resume}`);
            return;
        }

        const { upsertResumeVector } = await import('./pineconeUpsert.js');
        await upsertResumeVector(saved, {
            userId:            userId ?? resume.user.toString(),
            jobTitle:          resume.jobTitle?.name ?? '',
            location:          resume.location?.name ?? '',
            skills:            (resume.skills ?? []).map((s: any) => s.name).filter(Boolean),
            strongSkills:      (resume.skills ?? [])
                                   .filter((s: any) => ['Advanced', 'Expert'].includes(s.level))
                                   .map((s: any) => s.name)
                                   .filter(Boolean),
            previousJobTitles: (resume.workExperience ?? []).map((w: any) => w.jobTitle).filter(Boolean),
            previousCompanies: (resume.workExperience ?? []).map((w: any) => w.company).filter(Boolean),
            certifications:    (resume.certifications ?? []).map((c: any) => c.name).filter(Boolean),
            predictedSalary:      resume.predictedSalary             ?? 0,
            totalExperienceYears: saved.metrics?.totalExperienceYears ?? 0,
        });
    } catch (error) {
        logger.error(`[PINECONE] Resume upsert failed — non-fatal: ${saved.resume}`, error);
    }
}


/**
 * Handles Pinecone upsert after a job posting embedding is saved to MongoDB.
 * Threshold-gated and non-fatal — never breaks the embedding pipeline.
 *
 * Called from embeddingRegistryV2 jobPosting.afterSave
 */
export const handleJobVectorUpsert = async (
    saved: JobPostingEmbeddingsDocument,
    bypassThreshold = false,   // ← reconciliation passes true
) => {
    try {
        if (!bypassThreshold) {
            const { shouldUsePinecone } = await import('./pineconeThreshold.js');
            if (!await shouldUsePinecone()) {
                logger.info(`[Pinecone] Below threshold — skipping job upsert: ${saved.jobPosting}`);
                return;
            }
        }
        
        const { shouldUsePinecone } = await import('./pineconeThreshold.js');
        if (!await shouldUsePinecone()) {
            logger.info(`[Pinecone] Below threshold — skipping job upsert: ${saved.jobPosting}`);
            return;
        }

        const JobPosting = (await import('../../models/jobPostings/jobPostingModel.js')).default;
        const job = await JobPosting.findById(saved.jobPosting).lean();
        if (!job) {
            logger.warn(`[Pinecone] JobPosting not found for upsert: ${saved.jobPosting}`);
            return;
        }

        const { upsertJobVector } = await import('./pineconeUpsert.js');
        await upsertJobVector(saved, {
            title:                  job.title?.name                    ?? '',
            location:               job.location?.name                 ?? '',
            skills:                 (job.skills ?? []).map((s: any) => s.name).filter(Boolean),
            requiredSkills:         (job.skills ?? [])
                                        .filter((s: any) => s.requirementLevel === 'Required')
                                        .map((s: any) => s.name)
                                        .filter(Boolean),
            experienceLevel:        job.experienceLevel                ?? '',
            jobType:                job.jobType                        ?? '',
            yearsOfExperience:      job.requirements?.yearsOfExperience ?? 0,
            salaryMin:              job.salary?.min                    ?? 0,
            salaryMax:              job.salary?.max                    ?? 0,
            salaryCurrency:         job.salary?.currency               ?? '$',
            salaryFrequency:        job.salary?.frequency              ?? 'year',
            requiredCertifications: job.requirements?.certifications   ?? [],
        });
    } catch (error) {
        logger.error(`[PINECONE] Job upsert failed — non-fatal: ${saved.jobPosting}`, error);
    }
}