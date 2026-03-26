import axios from "axios"
import { Types } from "mongoose"
import { BASE_API_URL } from "../../src/config/api"

export type JobTitleSearchResult = {
    _id: Types.ObjectId,
    title: string
}

export const searchJobTitle = async (name: string): Promise<JobTitleSearchResult[]> => {
    const { data } = await axios.get(`${BASE_API_URL}/job-titles/search/${name}`)
    return data.data
}