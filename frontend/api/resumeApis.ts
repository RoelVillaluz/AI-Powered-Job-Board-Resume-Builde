import axios from "axios"
import { BASE_API_URL } from "../src/config/api"
import type { Resume } from "../types/models/resume"
import type { JobMatchEntry, ResumeJobMatchDocument } from "../src/types/api/resumes/resumeJobMatch.types"
import type { ResumeScore, LegacyScoreResult } from "../src/types/api/resumes/resumeScore.types"
import type { ResumeEmbeddings } from "../src/types/api/resumes/resumeEmbeddings.types"
import type { SalaryPrediction } from "../src/types/api/resumes/salaryPrediction.types"
import type { GenerateInsightResponse } from "../src/types/api/resumes/matchInsight.types"

/**
 * Fetch all resumes for a user.
 * @param {string} userId - The ID of the user
 * @returns {Promise<Resume[]>} Array of resumes
 */
export const fetchUserResumes = async (userId: string): Promise<Resume[]> => {
  const { data } = await axios.get<{ data: Resume[] }>(`${BASE_API_URL}/resumes/user/${userId}`)
  return data.data
}

/**
 * Fetch the resume for a specific resume.
 * @param {string} resumeId - The ID of the resume
 * @returns {Promise<Resume>} The resume object
 */
export const fetchResume = async (resumeId: string): Promise<Resume> => {
  const { data } = await axios.get<{ data: Resume }>(`${BASE_API_URL}/resumes/${resumeId}`)
  return data.data
}

export const fetchResumeEmbeddingsV2 = async (
    resumeId: string,
    token: string
): Promise<ResumeEmbeddings> => {
    const { data } = await axios.get<{ data: ResumeEmbeddings }>(
        `${BASE_API_URL}/resumes/${resumeId}/embeddings`,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return data.data;
};

/**
 * Fetch the AI-generated resume score for a given resume ID (legacy v1 —
 * branches between cached 200 and queued 202 responses).
 * @param {string} resumeId - The ID of the resume
 * @returns {Promise<LegacyScoreResult>} Cached score or queue status
 */
export const fetchResumeScore = async (
    resumeId: string,
    token: string
): Promise<LegacyScoreResult> => {
  const res = await axios.get(`${BASE_API_URL}/resumes/${resumeId}/score`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  // Cached score
  if (res.status === 200 && res.data?.data !== undefined) {
    return {
      data: res.data.data,
      status: "ready"
    }
  }

  // Queued
  if (res.status === 202) {
    return {
      data: null,
      status: "queued",
      jobId: res.data.jobId,
      statusUrl: res.data.statusUrl
    }
  }

  throw new Error(`Unexpected response from score endpoint (status ${res.status})`);
}

export const fetchResumeScoreV2 = async (
    resumeId: string,
    token: string
): Promise<ResumeScore> => {
    const { data } = await axios.get<{ data: ResumeScore }>(
        `${BASE_API_URL}/resumes/${resumeId}/score`,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return data.data;
};

/**
 * Fetches similarity score between job and resume (legacy /ai/compare endpoint,
 * which does NOT use the standard { data } envelope — the raw result is returned).
 * @param {string} resumeId - ID of current resume being compared with the job
 * @param {string} jobId - Job posting being compared
 * @returns {Promise<Record<string, unknown>>} Legacy similarity payload
 */
export const fetchResumeJobSimilarity = async (
    resumeId: string,
    jobId: string
): Promise<Record<string, unknown>> => {
  const { data } = await axios.get(`${BASE_API_URL}/ai/compare/${resumeId}/${jobId}`)
  return data
}

export const fetchResumeSalaryPrediction = async (
    resumeId: string,
    token: string
): Promise<SalaryPrediction> => {
  const { data } = await axios.get<{ data: SalaryPrediction }>(
      `${BASE_API_URL}/resumes/${resumeId}/salary-prediction`,
      { headers: { Authorization: `Bearer ${token}` } }
  );

  return data.data
}

export const fetchResumeJobMatches = async (
    resumeId: string,
    token: string
): Promise<ResumeJobMatchDocument> => {
  const { data } = await axios.get<{ data: ResumeJobMatchDocument }>(
      `${BASE_API_URL}/resumes/${resumeId}/job-matches`,
      { headers: { Authorization: `Bearer ${token}` } }
  )

  return data.data
}

/**
 * Fetches the cached match breakdown for a single job from the resume's
 * ranked match list.
 * @param {string} resumeId
 * @param {string} jobId
 * @param {string} token
 * @returns {Promise<JobMatchEntry>} the match entry (404 if not yet ranked)
 */
export const fetchResumeJobMatch = async (
    resumeId: string,
    jobId: string,
    token: string
): Promise<JobMatchEntry> => {
  const { data } = await axios.get<{ data: JobMatchEntry }>(
    `${BASE_API_URL}/resumes/${resumeId}/job-matches/${jobId}`,
    { headers: { Authorization: `Bearer ${token}` } }
  )
  return data.data
}

/**
 * Triggers generation of a RAG-based fit explanation for a resume/job match.
 * Fire-and-forget from the frontend's perspective — result arrives via the
 * `matchInsight:complete` socket event, not this response.
 * @param {string} resumeId
 * @param {string} jobId
 * @returns {Promise<GenerateInsightResponse>} the backend envelope wrapping the
 *   queue job id, not the insight itself
 */
export const generateMatchInsight = async (
    resumeId: string,
    jobId: string,
    token: string
): Promise<GenerateInsightResponse> => {
  const { data } = await axios.post<GenerateInsightResponse>(
    `${BASE_API_URL}/resumes/${resumeId}/job-matches/${jobId}/insight`,
    {},
    { headers: { Authorization: `Bearer ${token}` } }
  )
  return data
}
