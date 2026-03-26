import axios from "axios"
import { Types } from "mongoose"
import { BASE_API_URL } from "../../src/config/api"

export type SkillSearchResult = {
    _id: Types.ObjectId,
    name: string
}

export const searchSkills = async (name: string): Promise<SkillSearchResult[]> => {
    const { data } = await axios.get(`${BASE_API_URL}/skills/search/${name}`)
    return data.data
}