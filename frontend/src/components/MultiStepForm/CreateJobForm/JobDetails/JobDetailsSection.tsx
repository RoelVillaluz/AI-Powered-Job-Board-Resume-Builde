import { useState } from "react";
import { SearchableSelect } from "../../../FormComponents/SearchableSelect";
import { useSearchJobTitleQuery } from "../../../../hooks/market/jobTitle/useJobTitleQueries";
import { useSearchLocationQuery } from "../../../../hooks/market/locations/useLocationQueries";
import { useDebounce } from "../../../../hooks/useDebounce";
import { useJobForm } from "../../../../contexts/JobFormContexts/JobPostingFormContext";
import { SalaryInputField } from "./SalaryInputField";
import { JobTypeField } from "./JobTypeField";
import { ExperienceLevelField } from "./ExperienceLevelField";

/**
 * JobDetailsSection
 * ------------------
 * Step 1 of the Create Job multi-step form.
 *
 * ## Draft restore
 * Because `useCreateJobFormData` seeds `formData` synchronously from the
 * draft store before the first render, `formData.title.name` and
 * `formData.location.name` are already correct when this component mounts.
 * The `useState` initialisers below capture the right values immediately —
 * no `useEffect` re-sync is needed.
 */
function JobDetailsSection() {
  const { formData, handleSelect, handleClearSelection } = useJobForm();

  // These seed correctly on first render because formData is already
  // populated from the draft store before this component mounts.
  const [jobTitleSearch, setJobTitleSearch] = useState(
    formData.title?.name ?? ""
  );
  const [locationSearch, setLocationSearch] = useState(
    formData.location?.name ?? ""
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
              setJobTitleSearch(opt.name);
            }}
            options={jobTitleOptions.map((job) => ({
              _id: job._id.toString(),
              name: job.title,
            }))}
            onClear={() => {
              handleClearSelection("title");
              setJobTitleSearch("");
            }}
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
            onClear={() => {
              handleClearSelection("location");
              setLocationSearch("");
            }}
            isLoading={isLocationLoading}
            placeholder="Search locations..."
          />
        </div>

        <ExperienceLevelField />
        <JobTypeField />
        <SalaryInputField />
      </div>
    </section>
  );
}

export default JobDetailsSection;