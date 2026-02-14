import { useState, useEffect } from "react";
import type {
  JobseekerFormData,
  EmployerFormData,
  GetStartedFormData,
  UserRole,
} from "../../../types/forms/getStartedForm.types";
import type { SocialMedia } from "../../../types/models/resume";
import { JOBSEEKER_INITIAL_FORM_DATA, COMPANY_INITIAL_FORM_DATA } from "../../../constants/formSchemas";

type InputEvent = React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>;

// Fully typed hook
export const useGetStartedFormData = (
  selectedRole: UserRole | null,
  userId: string | null
) => {
    // --- Helper: create initial form data based on role ---
    const getInitialData = (
        role: UserRole | null,
        userId: string | null
    ): GetStartedFormData | null => {
        if (!role) return null;

        if (role === "jobseeker") {
            return {
                role: "jobseeker",
                data: {
                    user: userId ? { id: userId } : null,
                    ...JOBSEEKER_INITIAL_FORM_DATA,
                },
            };
        }

        if (role === "employer") {
            return {
                role: "employer",
                data: {
                    user: userId ? { id: userId } : null,
                    ...COMPANY_INITIAL_FORM_DATA,
                },
            };
        }

        return null;
    };

    // --- State ---
    const [formData, setFormData] = useState<GetStartedFormData | null>(
        getInitialData(selectedRole, userId)
    );

    // Reset form if role or user changes
    useEffect(() => {
        setFormData(getInitialData(selectedRole, userId));
    }, [selectedRole, userId]);

    // --- Handle input changes ---
    const handleChange = (e: InputEvent) => {
        const { name, value } = e.target;
        const keys = name.split(".");

        setFormData((prev) => {
        if (!prev) return prev;

        // --- Jobseeker fields ---
        if (prev.role === "jobseeker") {
            if (keys[0] === "socialMedia") {
                return {
                    ...prev,
                    data: {
                        ...prev.data,
                        socialMedia: {
                            ...prev.data.socialMedia,
                            [keys[1] as keyof SocialMedia]: value,
                        },
                    },
                };
            }

            // top-level field
            if (name in prev.data) {
                return {
                    ...prev,
                    data: {
                        ...prev.data,
                        [name]: value,
                    } as JobseekerFormData,
                };
            }
        }

        // --- Employer fields ---
        if (prev.role === "employer") {
            if (name in prev.data) {
            return {
                ...prev,
                data: {
                    ...prev.data,
                    [name]: value,
                } as EmployerFormData,
                };
            }
        }

        return prev;
        });
    };

    // --- Remove item from list ---
    const handleRemoveListItem = <K extends keyof JobseekerFormData>(
        name: K,
        index: number
    ) => {
            setFormData((prev) => {
            if (!prev || prev.role !== "jobseeker") return prev;

            const list = prev.data[name];
            if (!Array.isArray(list)) return prev;

            const updatedList = [...list];
            updatedList.splice(index, 1);

            return {
                ...prev,
                data: {
                ...prev.data,
                [name]: updatedList,
                } as JobseekerFormData,
            };
        });
    };

    // --- Drag & drop reorder ---
    const handleDragEnd = <K extends keyof JobseekerFormData>(
        name: K,
        result: { source: { index: number }; destination?: { index: number } | null }
    ) => {
        // Check if destination is null or undefined, return early if true
        if (!result.destination) return;

        // Now TypeScript knows destination exists
        const destination = result.destination; // TypeScript now knows it's not undefined or null

        setFormData((prev) => {
            if (!prev || prev.role !== "jobseeker") return prev;

            const list = prev.data[name];
            if (!Array.isArray(list)) return prev;

            const updatedList = [...list];
            const [movedItem] = updatedList.splice(result.source.index, 1);
            updatedList.splice(destination.index, 0, movedItem);

            return {
                ...prev,
                data: {
                    ...prev.data,
                    [name]: updatedList,
                } as JobseekerFormData,
            };
        });
    };


    // --- Prevent Enter key submit ---
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") e.preventDefault();
    };

  return {
        formData,
        setFormData,
        handleChange,
        handleKeyDown,
        handleRemoveListItem,
        handleDragEnd,
    };
};
