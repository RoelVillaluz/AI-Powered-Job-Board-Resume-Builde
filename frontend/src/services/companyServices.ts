import axios from "axios";
import { BASE_API_URL } from "../config/api";
import type { Company } from "../../types/models/company";

export const createCompanyService = async (
    companyData: Company,
    token: string
): Promise<Company> => {
    const { data } = await axios.post<{ data: Company }>(
        `${BASE_API_URL}/companies`,
        companyData,
        { headers: { Authorization: `Bearer ${token}` }}
    )

    return data.data
}