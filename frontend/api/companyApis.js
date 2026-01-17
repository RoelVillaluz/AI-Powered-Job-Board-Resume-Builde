import axios from "axios"
import { BASE_API_URL } from "../src/config/api"

export const fetchCompany = async (id) => {
    const { data } = await axios.get(`${BASE_API_URL}/companies/${id}`)
    return data.data
}

export const fetchRecommendedCompanies = async (userId) => {
    const { data } = await axios.get(`${BASE_API_URL}/ai/recommend-companies/${userId}`)
    return data
}