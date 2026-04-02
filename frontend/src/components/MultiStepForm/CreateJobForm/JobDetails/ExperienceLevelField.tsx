import type { CreateJobFormData } from "../../../../../types/forms/createJobForm.types";
import { useJobForm } from "../../../../contexts/JobFormContexts/JobPostingFormContext";
import { DropdownField } from "../../../FormComponents/DropdownField";

export const EXPERIENCE_LEVEL_OPTIONS = [
    { value: "Intern", label: "Intern" },
    { value: "Entry",  label: "Entry"  },
    { value: "Mid-Level",   label: "Mid-Level" },
    { value: "Senior",  label: "Senior" },
] as const satisfies { value: CreateJobFormData["experienceLevel"]; label: string }[];

export const ExperienceLevelField = () => {
    const { formData, handleChange } = useJobForm();

    return (
        <div className="form-group">
            <label htmlFor="">Experience Level</label>
            <div className="form-group">
                <DropdownField
                    label="Experience Level"
                    name="experienceLevel"
                    value={formData.experienceLevel}
                    options={EXPERIENCE_LEVEL_OPTIONS}
                    onChange={handleChange}
                    allowUndefined
                />
            </div>
        </div>
    )
}