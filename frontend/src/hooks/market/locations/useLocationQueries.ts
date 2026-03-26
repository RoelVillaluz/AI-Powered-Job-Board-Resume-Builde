import { useQuery } from "@tanstack/react-query";
import type { UseQueryResult } from "@tanstack/react-query"
import { searchLocations } from "../../../../api/market/locationApi";
import type { LocationSearchResult } from "../../../../api/market/locationApi"; 

export const useSearchLocationQuery = (name: string): UseQueryResult<LocationSearchResult[], Error> => {
    return useQuery({
        queryKey: ['locations', name],
        queryFn: () => searchLocations(name),
        enabled: !!name,
        staleTime: 1000 * 60 * 5
    })
}