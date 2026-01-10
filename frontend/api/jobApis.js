import axios from "axios";
import { BASE_API_URL } from "../src/config/api";

export const fetchJobPostings = async () => {
    const { data } = await axios.get(`${BASE_API_URL}/job-postings/`)
    return data.data
}

export const fetchJobRecommendations = async (userId) => {
  const { data } = await axios.get(
    `${BASE_API_URL}/ai/job-recommendations/${userId}`
  )
  return data.data
}

export const fetchInteractedJobs = async (userId) => {
  const { data } = await axios.get(
    `${BASE_API_URL}/users/${userId}/interacted-jobs`
  )
  return data.data
}