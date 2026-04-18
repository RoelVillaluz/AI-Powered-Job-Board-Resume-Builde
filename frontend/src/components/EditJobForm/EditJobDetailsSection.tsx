import { useEditJobForm } from "../../contexts/JobFormContexts/EditJobFormContext";
import { SearchableSelect } from "../FormComponents/SearchableSelect";
import type { CreateJobFormData } from "../../../types/forms/createJobForm.types";
import { setDeep } from "../../utils/forms/formUtils";
import { DropdownField } from "../FormComponents/DropdownField";
import { CURRENCY_OPTIONS, EXPERIENCE_LEVEL_OPTIONS, FREQUENCY_OPTIONS, JOB_TYPE_OPTIONS } from '../../../constants/jobFormConstants'
import { useSearchLocationQuery } from "../../hooks/market/locations/useLocationQueries";
import { useDebounce } from "../../hooks/useDebounce";
import { useSearchJobTitleQuery } from "../../hooks/market/jobTitle/useJobTitleQueries";
import { useEffect, useState } from "react";

export const EditJobDetailsSection = () => {
    const { formData, setFormData, handleSelect, handleClearSelection, handleChange } = useEditJobForm();

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

    const setField = (name: string, value: any) => {
        setFormData((prev) => {
            if (!prev) return prev;
            return setDeep(prev, name, value) as CreateJobFormData;
        });
    };

    useEffect(() => {
    if (formData.title?.name && !jobTitleSearch) {
        setJobTitleSearch(formData.title.name);
    }
    }, [formData.title?.name]);

    useEffect(() => {
    if (formData.location?.name && !locationSearch) {
        setLocationSearch(formData.location.name);
    }
    }, [formData.location?.name]);

    return (
        <>
            <div className="editor-form__section-label">Job info</div>

            <div className="editor-form__row">
                {/* JOB TITLE */}
                <div className="editor-form__field">
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
                        onBlur={() => {
                        // If user typed something but didn't select from dropdown,
                        // commit whatever is in the search input as a free-text value
                        if (jobTitleSearch && !formData.title.name) {
                            handleSelect("title", { _id: "", name: jobTitleSearch });
                        }
                        }}
                        isLoading={isJobTitleLoading}
                        placeholder="Search job titles..."
                    />
                </div>

                {/* LOCATION */}
                <div className="editor-form__field">
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
                        onBlur={() => {
                        // If user typed something but didn't select from dropdown,
                        // commit whatever is in the search input as a free-text value
                        if (locationSearch && !formData.location.name) {
                            handleSelect("location", { _id: "", name: locationSearch });
                        }
                        }}
                        isLoading={isLocationLoading}
                        placeholder="Search locations..."
                    />
                </div>
            </div>

            <div className="editor-form__row">
                {/* EXPERIENCE LEVEL */}
                <div className="editor-form__field">
                    <label className="editor-form__label">Experience level</label>
                    <DropdownField
                        label="Experience Level"
                        name="experienceLevel"
                        value={formData?.experienceLevel ?? undefined}
                        onChange={handleChange}
                        options={EXPERIENCE_LEVEL_OPTIONS}
                    />
                </div>

                {/* JOB TYPE */}
                <div className="editor-form__field">
                    <label className="editor-form__label">Job Type</label>
                    <DropdownField
                        label="Job Type"
                        name="jobType"
                        value={formData?.jobType ?? "Full-Time"}
                        onChange={handleChange}
                        options={JOB_TYPE_OPTIONS}
                    />
                </div>
            </div>

            {/* SALARY */}
            <div className="editor-form__field">
                <label className="editor-form__label">Salary</label>

                <div className="editor-form__salary-row">
                    <DropdownField
                        label="Currency"
                        name="salary.currency"
                        value={formData?.salary?.currency ?? "$"}
                        onChange={handleChange}
                        options={CURRENCY_OPTIONS}
                    />
                    
                    <input
                        className="editor-form__input"
                        type="number"
                        name="salary.min"
                        placeholder="Min"
                        value={formData?.salary?.min ?? ""}
                        onChange={(e) =>
                            setField("salary.min", e.target.value)
                        }
                    />

                    <input
                        className="editor-form__input"
                        type="number"
                        name="salary.max"
                        placeholder="Max"
                        value={formData?.salary?.max ?? ""}
                        onChange={(e) =>
                            setField("salary.max", e.target.value)
                        }
                    />

                    <DropdownField
                        label="Frequency"
                        name="salary.frequency"
                        value={formData?.salary?.frequency ?? "year"}
                        onChange={handleChange}
                        options={FREQUENCY_OPTIONS}
                    />
                </div>
            </div>
        </>
    );
};