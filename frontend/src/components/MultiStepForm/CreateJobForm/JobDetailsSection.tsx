import { useState } from "react";
import type { CreateJobFormData } from "../../../../types/forms/createJobForm.types";
import { SearchableSelect } from "../../FormComponents/SearchableSelect";
import type { SelectOption } from "../../../hooks/createJobForm/useCreateJobFormData";
import { useSearchJobTitleQuery } from "../../../hooks/market/jobTitle/useJobTitleQueries";
import { useSearchLocationQuery } from "../../../hooks/market/locations/useLocationQueries";
import { useDebounce } from "../../../hooks/useDebounce";
import { InputField } from "../../FormComponents/InputField";
import { SalaryInputField } from "./SalaryInputField";

type JobDetailsSectionProps = {
  formData: CreateJobFormData;
  handleChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => void;
  handleSelect: (field: "title" | "location", option: SelectOption) => void;
};

/**
 * JobDetailsSection
 * ------------------
 * Step 1 of the Create Job multi-step form. Collects the core job metadata:
 * title, location, experience level, and job type.
 *
 * Title and location use SearchableSelect with debounced API queries.
 * The search inputs are kept as local state so the user can type freely
 * without every keystroke writing to the global form state; `onSelect`
 * commits the final confirmed value to `formData` via `handleSelect`.
 *
 * @param formData     - Current form state from useCreateJobFormData
 * @param handleChange - Generic change handler for flat text inputs
 * @param handleSelect - Commit handler for SearchableSelect confirmations
 */
function JobDetailsSection({
  formData,
  handleChange,
  handleSelect,
}: JobDetailsSectionProps) {
  // Local search strings are intentionally separate from formData — they
  // represent the *in-progress* typed query, not the committed selection.
  // On select, formData is updated via handleSelect; on a fresh load or
  // form reset, we seed from formData so the field is never blank.
  const [jobTitleSearch, setJobTitleSearch] = useState(
    formData.title.name ?? ""
  );
  const [locationSearch, setLocationSearch] = useState(
    formData.location.name ?? ""
  );

  const debouncedJobTitle = useDebounce(jobTitleSearch, 300);
  const debouncedLocation = useDebounce(locationSearch, 300);

  const { data: jobTitleOptions = [], isLoading: isJobTitleLoading } =
    useSearchJobTitleQuery(debouncedJobTitle);
  const { data: locationOptions = [], isLoading: isLocationLoading } =
    useSearchLocationQuery(debouncedLocation);

  return (
    <section className="job-posting-details">
      <header className="w-full border-b border-gray-200 pb-6 mb-6">
        <h3 className="text-xl md:text-2xl font-semibold">Job Info</h3>
        <p className="text-sm md:text-base text-gray-600 mt-1">
          Let&apos;s get the basics down. Add the job title and other important details!
        </p>
      </header>

      <div className="form-details flex flex-col gap-4 w-full">
        <div className="row flex gap-3 w-full">
          <SearchableSelect
            label="Job Title"
            name="title"
            value={jobTitleSearch}
            onChange={setJobTitleSearch}
            onSelect={(opt) => {
              handleSelect("title", opt);
              // Keep the search input in sync with the confirmed selection
              setJobTitleSearch(opt.name);
            }}
            options={jobTitleOptions.map((job) => ({
              _id: job._id.toString(),
              name: job.title,
            }))}
            isLoading={isJobTitleLoading}
            placeholder="Search job titles..."
          />

          <SearchableSelect
            label="Location"
            name="location"
            value={locationSearch}
            onChange={setLocationSearch}
            onSelect={(opt) => {
              handleSelect("location", opt);
              setLocationSearch(opt.name);
            }}
            options={locationOptions.map((loc) => ({
              _id: loc._id.toString(),
              name: loc.name,
            }))}
            isLoading={isLocationLoading}
            placeholder="Search locations..."
          />
        </div>

        <InputField
          label="Experience Level"
          name="experienceLevel"
          value={formData.experienceLevel ?? ""}
          onChange={handleChange}
        />
        <InputField
          label="Job Type"
          name="jobType"
          value={formData.jobType}
          onChange={handleChange}
        />
        <SalaryInputField
            formData={formData}
            onChange={handleChange}
        />
      </div>
    </section>
  );
}

export default JobDetailsSection;