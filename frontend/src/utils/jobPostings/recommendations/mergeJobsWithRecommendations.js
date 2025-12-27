export const mergeJobsWithRecommendations = (jobs, recommendations) => {
    if (!recommendations.length) return jobs;

    const recMap = new Map(
        recommendations.map(r => [r._id, r])
    );

    return jobs.map(job => {
        const rec = recMap.get(job._id);
        if (!rec) return job;

        return {
            ...job,
            similarity: rec.similarity,
            matchScore: rec.matchScore ?? rec.similarity ?? 0,
        };
    });
};
