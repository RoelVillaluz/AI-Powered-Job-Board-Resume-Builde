import { SearchableSelect } from "../../../FormComponents/SearchableSelect";
import { useGetStartedForm } from "../../../../contexts/GetStartedFormContext";
import { useSearchLocationQuery } from "../../../../hooks/market/locations/useLocationQueries";
import { useEffect, useState } from "react";
import { useDebounce } from "../../../../hooks/useDebounce";

export const CompanyFormGroup = () => {
    const { formData, handleChange, handleSelect, handleClearSelection, handleFreeTextInput } =
        useGetStartedForm();
    
    // Guard: this step only renders when formData exists
    if (!formData) return null;

    const isJobseeker = formData.role === "jobseeker";

    const [locationSearch, setLocationSearch] = useState(
      isJobseeker ? (formData.data as any).location?.name ?? "" : ""
    );

    const debouncedLocation = useDebounce(locationSearch, 300);

    const { data: locationOptions = [], isLoading: isLocationLoading } =
      useSearchLocationQuery(debouncedLocation);

    return (
        <div className="form-details">
            <div className="row">
                <div className="form-group">
                  <label htmlFor="name">Company Name</label>
                  <input
                    type="text"
                    name="name"
                    value={(formData.data as any).name ?? ""}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* ── Location (SearchableSelect) ────────────────────────── */}
              <div className="form-group">
                <SearchableSelect
                  label="Location"
                  name="location"
                  value={locationSearch}
                  onChange={(value) => {
                    setLocationSearch(value);
                    handleFreeTextInput("location", value);
                  }}
                  onSelect={(opt) => {
                    handleSelect("location", {
                      _id: opt._id,
                      name: opt.name,
                    });
                    setLocationSearch(opt.name);
                  }}
                  onClear={() => {
                    handleClearSelection("location");
                    setLocationSearch("");
                  }}
                  options={locationOptions.map((l) => ({
                    _id: l._id.toString(),
                    name: l.name,
                  }))}
                  isLoading={isLocationLoading}
                  placeholder="Search locations..."
                />
                </div>
              <div className="row">
                <div className="form-group">
                  <label htmlFor="website">Website</label>
                  <input
                    type="text"
                    name="website"
                    value={(formData.data as any).website ?? ""}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="size">Size</label>
                  <input
                    type="text"
                    name="size"
                    value={(formData.data as any).size ?? ""}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea
                  name="description"
                  value={(formData.data as any).description ?? ""}
                  onChange={handleChange}
                />
            </div>
        </div>
    )
}