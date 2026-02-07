import React, { useState } from "react"
import { FormEvent, ChangeEvent, KeyboardEvent } from "react";
import { JobseekerFormData, EmployerFormData, GetStartedFormData, UserRole } from "../../../types/forms/getStartedForm.types";

type FormHandlerProps<T extends GetStartedFormData> = {
    formData: T,
    setFormData: React.Dispatch<React.SetStateAction<T>>,
    userId: string,
    selectedRole: UserRole,
    navigate: (path: string) => void;
}

export const useGetStartedFormData = <T extends GetStartedFormData>(
    initialData: T
) => {
    const [formData, setFormData] = useState<T>(initialData);

    // Handle input change
    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;
        const keys = name.split(".");

        setFormData(prev => {
            if (!prev) return prev;

            // Jobseeker-specific fields
            if (prev.role === "jobseeker") {
                // socialMedia nested update
                if (keys[0] === "socialMedia") {
                    return {
                        ...prev,
                        data: {
                            ...prev.data,
                            socialMedia: {
                                ...prev.data.socialMedia,
                                [keys[1]]: value
                            }
                        }
                    };
                }

                // default top-level field
                return {
                    ...prev,
                    data: {
                        ...prev.data,
                        [name]: value
                    }
                };
            }

            // Employer-specific fields
            if (prev.role === "employer") {
                return {
                    ...prev,
                    data: {
                        ...prev.data,
                        [name]: value
                    }
                };
            }

            return prev;
        });
    };

    // Remove item from a list (skills, workExperience, certifications, etc.)
    const handleRemoveListItem = (name: keyof JobseekerFormData, index: number) => {
        setFormData(prev => {
            if (!prev || prev.role !== "jobseeker") return prev;
            const updatedList = [...prev.data[name] as any];
            updatedList.splice(index, 1);
            return {
                ...prev,
                data: {
                    ...prev.data,
                    [name]: updatedList
                }
            }
        })
    }

    // Drag and drop reordering
    const handleDragEnd = (name: keyof JobseekerFormData, result: any) => {
        if (!result.destination) return;
        setFormData(prev => {
            if (!prev || prev.role !== "jobseeker") return prev;

            const reorderedList = [...prev.data[name] as any];
            const [movedItem] = reorderedList.splice(result.source.index, 1);
            reorderedList.splice(result.destination.index, 0, movedItem);

            return {
                ...prev,
                data: {
                    ...prev.data,
                    [name]: reorderedList
                }
            };
        });
    };

    // Handle enter key to prevent form submission
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            e.preventDefault();
        }
    };

    return {
        formData,
        setFormData,
        handleChange,
        handleKeyDown,
        handleRemoveListItem,
        handleDragEnd
    };
}