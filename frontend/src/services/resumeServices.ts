import axios from "axios"
import { BASE_API_URL } from "../config/api"
import type { Resume } from "../../types/models/resume";

export const createResumeService = async (
    resumeData: Resume,
    // token: string (Add later once authorization middleware is enforced)
): Promise<Resume> => {
    const { data } = await axios.post<{ data: Resume }>(
        `${BASE_API_URL}/resumes`,
        resumeData
    );

    return data.data;
};


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