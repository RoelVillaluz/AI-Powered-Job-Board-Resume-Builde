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

/**
 * Fetch the AI-generated resume score for a given resume ID.
 * @param {string} resumeId - The ID of the resume
 * @returns {Promise<number>} The resume score normalized between 0 and 1
 */
export const fetchResumeScore = async (resumeId) => {
  const res = await axios.get(`${BASE_API_URL}/resumes/${resumeId}/score`);

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

/**
 * Fetches similarity score between job and resume based on skills, work experience, preferences, etc
 * @param {string} resumeId - ID of current resume being compared with the job
 * @param {string} jobId - Job posting being compared
 * @returns {Promise<Number>} - Similarity percentage from 0-100%
 */
export const fetchResumeJobSimilarity = async (resumeId, jobId) => {
  const { data } = await axios.get(`${BASE_API_URL}/ai//compare/${resumeId}/${jobId}`)
  return data
}