import { useQuery } from "@tanstack/react-query";
import type { UseQueryResult } from "@tanstack/react-query"
import { searchSkills } from "../../../../api/market/skillApis";
import type { SkillSearchResult } from "../../../../api/market/skillApis";

/**
 * React Query hook for searching skills by name with optional exclusion.
 *
 * @param name - Partial or full skill name to search for
 * @param excludeIds - Array of skill IDs to exclude from results
 * @returns `UseQueryResult` with an array of SkillSearchResult
 */
export const useSkillSearchQuery = (
  name: string,
  excludeIds: string[]
): UseQueryResult<SkillSearchResult[], Error> => {
  return useQuery({
    queryKey: ['skills', name, excludeIds],
    queryFn: () => searchSkills(name, excludeIds),
    enabled: !!name,
    staleTime: 1000 * 60 * 5
  });
};