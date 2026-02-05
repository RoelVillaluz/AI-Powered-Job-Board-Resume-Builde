import axios from "axios"
import { BASE_API_URL } from "../config/api"
import type { Resume } from "../../types/models/resume";

export const updateResumeService = async (
    resumeId: string,
    updateData: Partial<Resume>,
    token?: string
): Promise<Resume> => {
    const { data } = await axios.patch<{ data: Resume }>(
        `${BASE_API_URL}/resumes/${resumeId}`,
        updateData,
        { headers: { Authorization: `Bearer ${token}` } }
    );

    return data.data;
};