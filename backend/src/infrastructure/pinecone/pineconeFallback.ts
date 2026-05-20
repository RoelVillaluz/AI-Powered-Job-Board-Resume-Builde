import { Types } from 'mongoose';
import JobPosting from '../../models/jobPostings/jobPostingModel.js';
import logger from '../../utils/logger.js';
import { JobMatch } from './pineconeQuery.js';

/**
 * MongoDB-based fallback for job matching when:
 * - Active job count is below PINECONE_JOB_THRESHOLD
 * - Pinecone query throws an error
 *
 * Uses skill overlap + experienceLevel filter as a lightweight proxy
 * for semantic similarity. Not as accurate as vector search but fast,
 * cheap, and always available.
 *
 * Returns results in the same JobMatch shape so the scoring layer
 * and LLM reranker don't need to know which path was taken.
 */
export const fallbackMongoJobQuery = async (
    resumeSkills:    string[],
    experienceLevel: string,
    jobType?:        string,
    topK = 20,
): Promise<JobMatch[]> => {
    logger.info('[Pinecone Fallback] Using MongoDB job query');

    const filter: Record<string, any> = {
        status: 'Active',
        ...(jobType        ? { jobType }        : {}),
        ...(experienceLevel ? { experienceLevel } : {}),
        ...(resumeSkills.length
            ? { 'skills.name': { $in: resumeSkills } }
            : {}),
    };

    const jobs = await JobPosting
        .find(filter)
        .sort({ postedAt: -1 })
        .limit(topK)
        .lean();

    return jobs.map(job => ({
        jobId:            (job._id as Types.ObjectId).toString(),
        vectorSimilarity: 0, // no vector score in fallback — scoring layer handles this
        metadata: {
            title:                  job.title?.name          ?? '',
            location:               job.location?.name       ?? '',
            skills:                 (job.skills ?? []).map((s: any) => s.name),
            requiredSkills:         (job.skills ?? [])
                                        .filter((s: any) => s.requirementLevel === 'Required')
                                        .map((s: any) => s.name),
            experienceLevel:        job.experienceLevel      ?? '',
            jobType:                job.jobType              ?? '',
            yearsOfExperience:      job.requirements?.yearsOfExperience ?? 0,
            salaryMin:              job.salary?.min          ?? 0,
            salaryMax:              job.salary?.max          ?? 0,
            salaryCurrency:         job.salary?.currency     ?? '$',
            salaryFrequency:        job.salary?.frequency    ?? 'year',
            requiredCertifications: job.requirements?.certifications ?? [],
            postedAt:               job.postedAt
                                        ? new Date(job.postedAt).getTime()
                                        : Date.now(),
        },
    }));
}