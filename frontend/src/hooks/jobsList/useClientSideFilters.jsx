import { useMemo } from "react";

/**
 * Client-side filtering for filters that cannot be done on backend
 * - minMatchScore: Requires match algorithm (from similarity/matchScore)
 * - applicationStatus: User-specific data
 */
export const useClientSideFilters = (jobs, filters, user) => {
    const filteredJobs = useMemo(() => {
        return jobs.filter(job => {
            // Match score filter - check both matchScore and similarity fields
            if (filters.minMatchScore > 0) {
                const matchScore = job.matchScore || job.similarity || 0;
                if (matchScore < filters.minMatchScore) return false;
            }

            // Application status filter (client-side only)
            const statusFilters = Object.entries(filters.applicationStatus)
                .filter(([_, isChecked]) => isChecked)
                .map(([status]) => status);

            if (statusFilters.length > 0) {
                const jobStatus = user?.applications?.find(
                    app => app.jobId === job._id
                )?.status || 'not applied';
                
                if (!statusFilters.includes(jobStatus)) return false;
            }

            return true;
        });
    }, [jobs, filters.minMatchScore, filters.applicationStatus, user]);

    return filteredJobs;
};