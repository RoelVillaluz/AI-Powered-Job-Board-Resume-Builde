import { useJobPosting } from "./useJobQueries";
import { useCompany } from "../companies/useCompanyQueries";
import { useMemo } from "react";

export const useJobDetails = (jobId, overrides = {}) => {
    const { data: fetchedJob, isLoading: isJobLoading, error: jobError } = useJobPosting(
        !overrides.job && jobId ? jobId : null  // only fetch if no override AND jobId exists
    )
    const job = overrides.job ?? fetchedJob;

    const { data: fetchedCompany, isLoading: isCompanyLoading, error: companyError } = useCompany(
        overrides.company ? null : job?.company._id
    );
    const company = overrides.company ?? fetchedCompany;

    const hasQuestions = Array.isArray(job?.preScreeningQuestions) && job?.preScreeningQuestions.length > 0;

    const isLoading = isJobLoading || isCompanyLoading;
    const error = jobError ?? companyError;

    // Memoize the return object to maintain stable reference
    return useMemo(
        () => ({ job, company, isLoading, error, hasQuestions }),
        [job, company, isLoading, error, hasQuestions]
    );
}