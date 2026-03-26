import { useQuery } from "@tanstack/react-query";
import type { UseQueryResult } from "@tanstack/react-query"
import { searchSkills } from "../../../../api/market/skillApis";
import type { SkillSearchResult } from "../../../../api/market/skillApis";

export const useSkillSearchQuery = (name: string): UseQueryResult<SkillSearchResult[], Error> => {
    return useQuery({
        queryKey: ['skills', name],
        queryFn: () => searchSkills(name),
        enabled: !!name,
        staleTime: 1000 * 60 * 5
    })
}