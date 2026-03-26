import { useState } from "react"
import type { CreateJobFormData } from "../../../types/forms/createJobForm.types"
import { CREATE_JOB_INITIAL_FORM_DATA } from "../../../constants/formSchemas";

type FormTarget = { target: { name: string; value: any } };

export const useCreateJobFormData = () => {
    const [formData, setFormData] = useState<CreateJobFormData>(CREATE_JOB_INITIAL_FORM_DATA);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement> | FormTarget) => {
        // Type narrowing for target
        const target = 'target' in e ? e.target : { name: '', value: '' };
        const { name, value } = target;

        const keys = name.split('.'); // support nested fields like 'salary.min'

        setFormData((prev) => {
        if (!prev) return prev;

        // --- Salary fields ---
        if (keys[0] === 'salary') {
            return {
            ...prev,
            salary: {
                ...prev.salary,
                salary: {
                    ...prev.salary.salary,
                    [keys[1] as keyof CreateJobFormData['salary']['salary']]: value,
                },
            },
            };
        }

        // --- Requirements nested fields ---
        if (keys[0] === 'requirements') {
            return {
                ...prev,
                requirements: {
                    ...prev.requirements,
                    [keys[1] as keyof CreateJobFormData['requirements']]: value,
                },
            };
        }

        // --- Top-level fields ---
        if (name in prev) {
            return {
                ...prev,
                [name]: value,
            };
        }

        return prev;
        });
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") e.preventDefault();
    };

    return { formData, setFormData, handleChange, handleKeyDown }
}