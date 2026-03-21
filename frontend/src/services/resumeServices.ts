import axios from "axios"
import { BASE_API_URL } from "../config/api"
import type { Resume } from "../../types/models/resume";
import type { JobseekerFormData } from "../../types/forms/getStartedForm.types";

export const createResumeService = async (
    resumeData: JobseekerFormData,
    // token: string (Add later once authorization middleware is enforced)
): Promise<JobseekerFormData> => {
    const { data } = await axios.post<{ data: JobseekerFormData }>(
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