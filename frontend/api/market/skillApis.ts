import axios from "axios"
import { Types } from "mongoose"
import { BASE_API_URL } from "../../src/config/api"

export type SkillSearchResult = {
    _id: Types.ObjectId,
    name: string
}

export const searchSkills = async (name: string, excludeIds: string[]): Promise<SkillSearchResult[]> => {
  const params = new URLSearchParams();
  params.append('name', name);

  excludeIds.forEach(id => params.append('excludeIds', id));

  const { data } = await axios.get(`${BASE_API_URL}/skills/search?${params.toString()}`);
  return data.data;
}