import { useQuery } from "@tanstack/react-query";
import type { UseQueryResult } from "@tanstack/react-query"
import { searchJobTitle } from "../../../../api/market/jobTitleApi";
import type { JobTitleSearchResult } from "../../../../api/market/jobTitleApi";

export const useSearchJobTitleQuery = (name: string): UseQueryResult<JobTitleSearchResult[], Error> => {
    return useQuery({
        queryKey: ['job-titles', name],
        queryFn: () => searchJobTitle(name),
        enabled: name.trim().length >= 2,
        staleTime: 1000 * 60 * 5
    })
}