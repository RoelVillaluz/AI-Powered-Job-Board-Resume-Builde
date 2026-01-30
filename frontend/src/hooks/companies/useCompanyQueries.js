import { useQuery } from "@tanstack/react-query"
import { fetchCompany, fetchRecommendedCompanies } from "../../../api/companyApis"

export const useCompany = (id) => {
    return useQuery({
        queryKey: ['company', id],
        queryFn: () => fetchCompany(id),
        staleTime: 1000 * 60 * 5,
        retry: 3,
        enabled: !!id,
    })
}

export const useRecommendedCompanies = (userId, token = null) => {
    return useQuery({
        queryKey: ['recommendedCompanies', userId],
        queryFn: () => fetchRecommendedCompanies(userId),
        retry: 3,
        staleTime: 1000 * 60 * 5,
        enabled: !!userId,
    })
}