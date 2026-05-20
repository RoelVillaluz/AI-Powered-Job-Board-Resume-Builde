import 'dotenv/config';
import pLimit from 'p-limit';
import { connectDB, disconnectDB } from '../config/db.js';
import { connectPinecone } from '../config/pinecone.js';
import { upsertResumeVector } from '../infrastructure/pinecone/pineconeUpsert.js';
import { upsertJobVector } from '../infrastructure/pinecone/pineconeUpsert.js';
import ResumeEmbedding from '../models/resumes/resumeEmbeddingsModel.js';
import JobEmbedding from '../models/jobPostings/jobPostingEmbeddingModel.js';
import Resume from '../models/resumes/resumeModel.js';
import JobPosting from '../models/jobPostings/jobPostingModel.js';
import logger from '../utils/logger.js';

const CONCURRENCY = 10;
const BATCH_SIZE  = 100;

async function backfillResumes(): Promise<void> {
    const total = await ResumeEmbedding.countDocuments();
    logger.info(`[Backfill] Resumes to process: ${total}`);
    if (total === 0) return;

    const limit = pLimit(CONCURRENCY);
    let processed = 0, succeeded = 0, failed = 0;

    for (let skip = 0; skip < total; skip += BATCH_SIZE) {
        const batch = await ResumeEmbedding.find().skip(skip).limit(BATCH_SIZE).lean();

        await Promise.allSettled(
            batch.map(doc => limit(async () => {
                try {
                    const resume = await Resume.findById(doc.resume).lean();
                    if (!resume) {
                        logger.warn(`[Backfill] Resume source not found: ${doc.resume}`);
                        failed++; return;
                    }

                    await upsertResumeVector(doc as any, {
                        userId:            resume.user.toString(),
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
                        totalExperienceYears: (doc as any).metrics?.totalExperienceYears ?? 0,
                    });
                    succeeded++;
                } catch (err) {
                    failed++;
                    logger.error(`[Backfill] Resume failed: ${doc.resume}`, err);
                } finally {
                    processed++;
                }
            }))
        );

        logger.info(`[Backfill] Resumes: ${processed}/${total} | ✓ ${succeeded} | ✗ ${failed}`);
    }

    logger.info(`[Backfill] Resumes complete — succeeded: ${succeeded} | failed: ${failed}`);
}

async function backfillJobs(): Promise<void> {
    const total = await JobEmbedding.countDocuments();
    logger.info(`[Backfill] Jobs to process: ${total}`);
    if (total === 0) return;

    const limit = pLimit(CONCURRENCY);
    let processed = 0, succeeded = 0, failed = 0;

    for (let skip = 0; skip < total; skip += BATCH_SIZE) {
        const batch = await JobEmbedding.find().skip(skip).limit(BATCH_SIZE).lean();

        await Promise.allSettled(
            batch.map(doc => limit(async () => {
                try {
                    const job = await JobPosting.findById(doc.jobPosting).lean();
                    if (!job) {
                        logger.warn(`[Backfill] JobPosting source not found: ${doc.jobPosting}`);
                        failed++; return;
                    }

                    await upsertJobVector(doc as any, {
                        title:                  job.title?.name                     ?? '',
                        location:               job.location?.name                  ?? '',
                        skills:                 (job.skills ?? []).map((s: any) => s.name).filter(Boolean),
                        requiredSkills:         (job.skills ?? [])
                                                    .filter((s: any) => s.requirementLevel === 'Required')
                                                    .map((s: any) => s.name)
                                                    .filter(Boolean),
                        experienceLevel:        job.experienceLevel                 ?? '',
                        jobType:                job.jobType                         ?? '',
                        yearsOfExperience:      job.requirements?.yearsOfExperience ?? 0,
                        salaryMin:              job.salary?.min                     ?? 0,
                        salaryMax:              job.salary?.max                     ?? 0,
                        salaryCurrency:         job.salary?.currency                ?? '$',
                        salaryFrequency:        job.salary?.frequency               ?? 'year',
                        requiredCertifications: job.requirements?.certifications    ?? [],
                    });
                    succeeded++;
                } catch (err) {
                    failed++;
                    logger.error(`[Backfill] Job failed: ${doc.jobPosting}`, err);
                } finally {
                    processed++;
                }
            }))
        );

        logger.info(`[Backfill] Jobs: ${processed}/${total} | ✓ ${succeeded} | ✗ ${failed}`);
    }

    logger.info(`[Backfill] Jobs complete — succeeded: ${succeeded} | failed: ${failed}`);
}

async function main() {
    logger.info('[Backfill] Starting Pinecone backfill (threshold bypassed)...');
    const start = Date.now();

    await connectDB();
    await connectPinecone();

    await backfillResumes();
    await backfillJobs();

    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    logger.info(`[Backfill] ✅ Complete in ${elapsed}s`);

    await disconnectDB();
    process.exit(0);
}

main().catch(err => {
    logger.error('[Backfill] ❌ Fatal error', err);
    process.exit(1);
});