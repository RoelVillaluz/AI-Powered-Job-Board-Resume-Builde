import { useQuery } from "@tanstack/react-query";
import type { UseQueryResult } from "@tanstack/react-query"
import { getJobTitleTopSkills, searchJobTitle } from "../../../../api/market/jobTitleApi";
import type { JobTitleSearchResult, JobTitleTopSkillsResult } from "../../../../api/market/jobTitleApi";
import { ImportanceLevel } from "@shared/constants/jobsAndIndustries/constants";

export const useSearchJobTitleQuery = (name: string): UseQueryResult<JobTitleSearchResult[], Error> => {
    return useQuery({
        queryKey: ['job-titles', name],
        queryFn: () => searchJobTitle(name),
        enabled: name.trim().length >= 2,
        staleTime: 1000 * 60 * 5
    })
}

export const useJobTitleTopSkillsQuery = (id: string, importance: ImportanceLevel): UseQueryResult<JobTitleTopSkillsResult> => {
    return useQuery({
        queryKey: ['job-titles', id],
        queryFn: () => getJobTitleTopSkills(id, importance),
        enabled: !!id,
        staleTime: 1000 * 60 * 5,
    })
}