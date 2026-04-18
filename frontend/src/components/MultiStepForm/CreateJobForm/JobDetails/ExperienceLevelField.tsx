import { EXPERIENCE_LEVEL_OPTIONS } from "../../../../../constants/jobFormConstants";
import { useJobForm } from "../../../../contexts/JobFormContexts/JobPostingFormContext";
import { DropdownField } from "../../../FormComponents/DropdownField";

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