import axios from "axios";
import { BASE_API_URL } from "../config/api";
import type { User } from "../../types/models/user";

export const updateUserService = async (
    userId: string,
    updateData: Partial<User>
): Promise<User> => {
    const { data } = await axios.patch<{ data: User }>(
        `${BASE_API_URL}/users/${userId}`,
        updateData
    );

    return data.data;
}