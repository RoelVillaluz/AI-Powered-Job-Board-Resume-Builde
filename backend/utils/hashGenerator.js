import crypto from 'crypto';

/**
 * Generate hash of resume data for cache invalidation
 * Only includes fields that affect embeddings
 */
export function generateResumeHash(resume) {
    const relevantData = {
            skills: resume.skills?.map(s => s.name).sort(),
            workExperience: resume.workExperience?.map(exp => ({
            jobTitle: exp.jobTitle,
            responsibilities: exp.responsibilities
        })),
        summary: resume.summary,
        certifications: resume.certifications?.map(c => c.name).sort()
    };
    
    return crypto
        .createHash('sha256')
        .update(JSON.stringify(relevantData))
        .digest('hex');
}

/**
 * Generate hash of job data
 */
export function generateJobHash(job) {
    const relevantData = {
        skills: job.skills?.map(s => s.name).sort(),
        requirements: job.requirements,
        title: job.title,
        description: job.description
    };
    
    return crypto
        .createHash('sha256')
        .update(JSON.stringify(relevantData))
        .digest('hex');
}