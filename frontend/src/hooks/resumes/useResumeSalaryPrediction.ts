import { useEffect, useRef } from "react";

import { useAuthStore }   from "../../stores/authStore";
import { useResumeStore } from "../../stores/resumeStore";

import { useResumeSalaryPredictionQuery } from "./useResumeQueries";
import { generateResumeSalaryPrediction } from "../../services/resumeServices";

export const useResumeSalaryPrediction = () => {
    const token    = useAuthStore(state => state.token);
    const resume   = useResumeStore(state => state.currentResume);
    const resumeId = resume?._id;

    const {
        data:      queryData,
        isLoading,
        error,
        refetch,
        isFetched,  // ← true once the GET has settled (success OR error)
    } = useResumeSalaryPredictionQuery(resumeId, token);

    const hasTriggeredRef = useRef(false);

    useEffect(() => {
        // Wait until the GET has fully settled before deciding anything.
        // This prevents firing the POST before we know whether data exists.
        if (!resumeId || !token)  return;
        if (!isFetched)           return;   // GET still in-flight — wait
        if (queryData)            return;   // record exists — nothing to do
        if (hasTriggeredRef.current) return; // POST already fired this session

        hasTriggeredRef.current = true;

        const run = async () => {
            try {
                await generateResumeSalaryPrediction(resumeId, token);
                await refetch();
            } catch (err) {
                console.error("salary generation failed:", err);
            }
        };

        run();
    }, [resumeId, token, isFetched, queryData]); // ← refetch intentionally excluded

    // Reset lock when the user switches to a different resume
    useEffect(() => {
        hasTriggeredRef.current = false;
    }, [resumeId]);

    return {
        predictedSalary: queryData ?? null,
        isLoading,
        isFetched,
        error,
    };
};