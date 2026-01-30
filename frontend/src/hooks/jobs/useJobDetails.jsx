import { useJobPosting } from "./useJobQueries";
import { useCompany } from "../companies/useCompanyQueries";
import { useMemo } from "react";

export const useJobDetails = (jobId) => {
    const { data: job, isLoading: isJobLoading, error: jobError } = useJobPosting(jobId);
    const { data: company, isLoading: isCompanyLoading, error: companyError } = useCompany(job?.company._id);

    const hasQuestions = Array.isArray(job?.preScreeningQuestions) && job?.preScreeningQuestions.length > 0;

    const isLoading = isJobLoading || isCompanyLoading;
    const error = jobError ?? companyError;

    // Memoize the return object to maintain stable reference
    return useMemo(
        () => ({ job, company, isLoading, error, hasQuestions }),
        [job, company, isLoading, error, hasQuestions]
    );
}