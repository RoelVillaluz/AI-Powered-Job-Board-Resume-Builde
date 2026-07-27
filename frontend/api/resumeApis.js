import axios from "axios"
import { BASE_API_URL } from "../src/config/api"

/**
 * Fetch all resumes for a user.
 * @param {string} userId - The ID of the user
 * @returns {Promise<Array>} Array of resumes
 */
export const fetchUserResumes = async (userId) => {
  const { data } = await axios.get(`${BASE_API_URL}/resumes/user/${userId}`)
  return data.data
}

/**
 * Fetch the resume for a specific resume.
 * @param {string} resumeId - The ID of the resume
 * @returns {Promise<Object>} The resume object
 */
export const fetchResume = async (resumeId) => {
  const { data } = await axios.get(`${BASE_API_URL}/resumes/${resumeId}`)
  return data.data
}

export const fetchResumeEmbeddingsV2 = async (resumeId, token) => {
    const { data } = await axios.get(`${BASE_API_URL}/resumes/${resumeId}/embeddings`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return data.data;
};

/**
 * Fetch the AI-generated resume score for a given resume ID.
 * @param {string} resumeId - The ID of the resume
 * @returns {Promise<number>} The resume score normalized between 0 and 1
 */
export const fetchResumeScore = async (resumeId, token) => {
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
}

export const fetchResumeScoreV2 = async (resumeId, token) => {
    const { data } = await axios.get(`${BASE_API_URL}/resumes/${resumeId}/score`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return data.data;
};
/**
 * Fetches similarity score between job and resume based on skills, work experience, preferences, etc
 * @param {string} resumeId - ID of current resume being compared with the job
 * @param {string} jobId - Job posting being compared
 * @returns {Promise<Number>} - Similarity percentage from 0-100%
 */
export const fetchResumeJobSimilarity = async (resumeId, jobId) => {
  const { data } = await axios.get(`${BASE_API_URL}/ai/compare/${resumeId}/${jobId}`)
  return data
}

export const fetchResumeSalaryPrediction = async (resumeId, token) => {
  const { data } = await axios.get(`${BASE_API_URL}/resumes/${resumeId}/salary-prediction`, {
    headers: { Authorization: `Bearer ${token}`}
  });

  return data.data
}

export const fetchResumeJobMatches = async (resumeId, token) => {
  const { data } = await axios.get(`${BASE_API_URL}/resumes/${resumeId}/job-matches`, {
    headers: { Authorization: `Bearer ${token}` }
  })

  return data.data
}

/**
 * Fetches the cached match breakdown for a single job from the resume's
 * ranked match list.
 * @param {string} resumeId
 * @param {string} jobId
 * @param {string} token
 * @returns {Promise<object|null>} the match entry, or null if not yet ranked
 */
export const fetchResumeJobMatch = async (resumeId, jobId, token) => {
  const { data } = await axios.get(
    `${BASE_API_URL}/resumes/${resumeId}/job-matches/${jobId}`,
    { headers: { Authorization: `Bearer ${token}` } } 
  )
  return data
}

/**
 * Triggers generation of a RAG-based fit explanation for a resume/job match.
 * Fire-and-forget from the frontend's perspective — result arrives via the
 * `matchInsight:complete` socket event, not this response.
 * @param {string} resumeId
 * @param {string} jobId
 * @returns {Promise<{ jobId: string }>} the queue job id, not the insight itself
 */
export const generateMatchInsight = async (resumeId, jobId, token) => {
  const { data } = await axios.post(
    `${BASE_API_URL}/resumes/${resumeId}/job-matches/${jobId}/insight`,
    {},
    { headers: { Authorization: `Bearer ${token}` } }
  )
  return data
}