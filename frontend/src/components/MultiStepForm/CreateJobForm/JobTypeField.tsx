import { useJobForm } from "../../../contexts/JobPostingFormContext";
import { DropdownField } from "../../FormComponents/DropdownField";
import type { CreateJobFormData } from "../../../../types/forms/createJobForm.types";

export const JOB_TYPE_OPTIONS = [
  { value: "Full-Time",  label: "Full-Time"  },
  { value: "Part-Time",  label: "Part-Time"  },
  { value: "Contract",   label: "Contract"   },
  { value: "Internship", label: "Internship" },
] as const satisfies { value: CreateJobFormData["jobType"]; label: string }[];

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