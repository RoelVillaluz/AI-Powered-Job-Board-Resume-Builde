import { useEffect, useState } from "react";
import { useGetStartedForm } from "../../../../contexts/GetStartedFormContext";
import { useDebounce } from "../../../../hooks/useDebounce";
import { useSearchJobTitleQuery } from "../../../../hooks/market/jobTitle/useJobTitleQueries";
import { useSearchLocationQuery } from "../../../../hooks/market/locations/useLocationQueries";
import { SearchableSelect } from "../../../FormComponents/SearchableSelect";
import { useAuthStore } from "../../../../stores/authStore";

export const JobseekerDetailsFormGroup = () => {
    const user = useAuthStore((state) => state.user);
    const { formData, setFormData, handleChange, handleSelect, handleClearSelection } =
          useGetStartedForm();

    // Guard: this step only renders when formData exists
    if (!formData) return null;

    const isJobseeker = formData.role === "jobseeker";

    // Local search strings for SearchableSelect — seeded from formData on mount
    const [jobTitleSearch, setJobTitleSearch] = useState(
      isJobseeker ? (formData.data as any).jobTitle?.name ?? "" : ""
    );
    const [locationSearch, setLocationSearch] = useState(
      isJobseeker ? (formData.data as any).location?.name ?? "" : ""
    );

    const debouncedJobTitle = useDebounce(jobTitleSearch, 300);
    const debouncedLocation = useDebounce(locationSearch, 300);

    const { data: jobTitleOptions = [], isLoading: isJobTitleLoading } =
      useSearchJobTitleQuery(debouncedJobTitle);
    const { data: locationOptions = [], isLoading: isLocationLoading } =
      useSearchLocationQuery(debouncedLocation);

    useEffect(() => {
    if (!user) return;
        setFormData((prev) => {
            if (!prev || prev.role !== "jobseeker") return prev;
            return {
                ...prev,
                data: {
                    ...prev.data,
                    firstName: user.firstName ?? prev.data.firstName,
                    lastName: user.lastName ?? prev.data.lastName,
                },
            };
        });
    }, [user]);

    return (
        <div className="form-details">
            {/* ── Name ──────────────────────────────────────────────── */}
            <div className="row">
            <div className="form-group">
                <label>First Name</label>
                <input
                type="text"
                name="firstName"
                value={(formData.data as any).firstName ?? ""}
                onChange={handleChange}
                />
            </div>
            <div className="form-group">
                <label>Last Name</label>
                <input
                type="text"
                name="lastName"
                value={(formData.data as any).lastName ?? ""}
                onChange={handleChange}
                />
            </div>
            </div>

            {/* ── Job title (SearchableSelect) ───────────────────────── */}
            <div className="form-group">
            <SearchableSelect
                label="Job Title"
                name="jobTitle"
                value={jobTitleSearch}
                onChange={setJobTitleSearch}
                onSelect={(opt) => {
                    handleSelect("jobTitle", opt);
                    setJobTitleSearch(opt.name);
                }}
                onClear={() => {
                    handleClearSelection("jobTitle");
                    setJobTitleSearch("");
                }}
                onBlur={() => {
                    if (jobTitleSearch && !(formData.data as any).jobTitle?.name) {
                        handleSelect("jobTitle", { _id: "", name: jobTitleSearch });
                    }
                }}
                options={jobTitleOptions.map((j) => ({
                    _id: j._id.toString(),
                    name: j.title,
                }))}
                isLoading={isJobTitleLoading}
                placeholder="Search job titles..."
            />
            </div>

            {/* ── Location (SearchableSelect) ────────────────────────── */}
            <div className="form-group">
            <SearchableSelect
                label="Location"
                name="location"
                value={locationSearch}
                onChange={setLocationSearch}
                onSelect={(opt) => {
                    handleSelect("location", opt);
                    setLocationSearch(opt.name);
                }}
                onClear={() => {
                    handleClearSelection("location");
                    setLocationSearch("");
                }}
                onBlur={() => {
                    if (locationSearch && !(formData.data as any).location?.name) {
                        handleSelect("location", { _id: "", name: locationSearch });
                    }
                }}
                options={locationOptions.map((l) => ({
                    _id: l._id.toString(),
                    name: l.name,
                }))}
                isLoading={isLocationLoading}
                placeholder="Search locations..."
            />
            </div>

            {/* ── Phone ─────────────────────────────────────────────── */}
            <div className="form-group">
            <label>Phone</label>
            <input
                type="text"
                name="phone"
                value={(formData.data as any).phone ?? ""}
                onChange={handleChange}
            />
            </div>

            {/* ── Social media ───────────────────────────────────────── */}
            <div className="form-group">
            <label>Social Media</label>
            <div className="row">
                <div className="wrapper">
                <i className="fa-brands fa-facebook" aria-hidden="true" />
                <input
                    type="text"
                    name="socialMedia.facebook"
                    value={(formData.data as any).socialMedia?.facebook ?? ""}
                    onChange={handleChange}
                />
                </div>
                <div className="wrapper">
                <i className="fa-brands fa-linkedin" aria-hidden="true" />
                <input
                    type="text"
                    name="socialMedia.linkedIn"
                    value={(formData.data as any).socialMedia?.linkedIn ?? ""}
                    onChange={handleChange}
                />
                </div>
            </div>
            <div className="row">
                <div className="wrapper">
                <i className="fa-brands fa-github" aria-hidden="true" />
                <input
                    type="text"
                    name="socialMedia.github"
                    value={(formData.data as any).socialMedia?.github ?? ""}
                    onChange={handleChange}
                />
                </div>
                <div className="wrapper">
                <i className="fa-solid fa-globe" aria-hidden="true" />
                <input
                    type="text"
                    name="socialMedia.website"
                    value={(formData.data as any).socialMedia?.website ?? ""}
                    onChange={handleChange}
                />
                </div>
            </div>
            </div>

            {/* ── Summary ───────────────────────────────────────────── */}
            <div className="form-group">
            <label>Summary</label>
            <textarea
                name="summary"
                value={(formData.data as any).summary ?? ""}
                onChange={handleChange}
            />
            </div>
        </div>
    )
}