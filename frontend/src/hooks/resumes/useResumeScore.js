import { useAuthStore } from "../../stores/authStore"
import { useResumeStore } from "../../stores/resumeStore"
import { useResumeScoreQuery, useUserResumesQuery } from "./useResumeQueries"

const messages = {
    0: { rating: "No Resume yet", message: "You don't have a resume yet. Please add a resume now." },
    25: { rating: "Poor", message: "Your resume needs significant improvement. Consider adding more details about your experience and skills." },
    5: { rating: "Average", message: "Your resume is decent, but there's room for improvement. Try refining your descriptions and adding measurable achievements." },
    75: { rating: "Good", message: "Your resume is well-structured! A few tweaks and refinements could make it even stronger." },
    90: { rating: "Great", message: "You're almost there, but filling out minor missing details could take it to the next level." },
    100: { rating: "Excellent", message: "Nearly flawless! Your resume effectively presents your qualifications" },
}

/**
 * Convenience hook to get both resume and score for the current user.
 * Handles the full flow: fetch resumes → set current → fetch score
 * @returns {Object} { currentResume, progress, loading, error, messages }
 */
export const useResumeScore = () => {
    const user = useAuthStore(state => state.user)
    const currentResume = useResumeStore(state => state.currentResume)
    
    // Step 1: Fetch all resumes for the user
    // This will automatically set currentResume via useEffect in useUserResumesQuery
    const { data: resumes, isLoading: resumesLoading, error: resumesError } = useUserResumesQuery(user?._id)

    // Step 2: Fetch score only when currentResume exists
    const { data: scoreData, isLoading: scoreLoading, error: scoreError } = useResumeScoreQuery(currentResume?._id)

    console.log('Resume score data: ', scoreData)

    // Determine overall loading state
    const isLoading = resumesLoading || scoreLoading

    // Combine errors
    const error = resumesError || scoreError

    return {
        currentResume,
        progress: scoreData?.data?.totalScore ?? 0,
        loading: isLoading,
        error,
        messages,
        // Extra helpful data
        hasResume: !!currentResume,
        totalResumes: resumes?.length ?? 0
    }
}