import { useJobForm } from "../../../../contexts/JobFormContexts/JobPostingFormContext";
import { DropdownField } from "../../../FormComponents/DropdownField";
import type { CreateJobFormData } from "../../../../../types/forms/createJobForm.types";
import { JOB_TYPE_OPTIONS } from "../../../../../constants/jobFormConstants";


/**
 * JobTypeField
 * -------------
 * Single dropdown for selecting the job's employment type.
 * Reads `formData` and `handleChange` from `JobFormContext`.
 */
export const JobTypeField = () => {
  const { formData, handleChange } = useJobForm();

  return (
    <div className="form-group">
        <label htmlFor="">Job Type</label>
        <DropdownField
            label="Job Type"
            name="jobType"
            value={formData.jobType}
            options={JOB_TYPE_OPTIONS}
            onChange={handleChange}
        />
    </div>
  );
};