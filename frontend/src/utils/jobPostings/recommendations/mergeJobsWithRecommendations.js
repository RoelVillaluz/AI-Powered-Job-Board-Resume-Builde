export const mergeJobsWithRecommendations = (jobs, recommendations) => {
    if (!recommendations.length) return jobs;

    const recMap = new Map(
        recommendations.map(r => [r.jobId, r])
    );

    return jobs.map(job => {
        const rec = recMap.get(job._id); // or job.jobId depending on your schema

        if (!rec) return job;

        return {
            ...job,
            similarity: rec.vectorSimilarity,
            matchScore: rec.matchScore ?? rec.vectorSimilarity ?? 0,
            finalScore: rec.finalScore,
        };
    });
};