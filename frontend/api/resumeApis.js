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
  const { data } = await axios.get(`${BASE_API_URL}/ai/resume-score/${resumeId}`)
  return data.score / 100
}