import axios from "axios"
import { Types } from "mongoose"
import { BASE_API_URL } from "../../src/config/api"

export type LocationSearchResult = {
    _id: Types.ObjectId,
    name: string
}

export const searchLocations = async (name: string): Promise<LocationSearchResult[]> => {
    const { data } = await axios.get(`${BASE_API_URL}/locations/search/${name}`)
    return data.data
}