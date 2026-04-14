import { useGetStartedForm } from "../../../../contexts/GetStartedFormContext";

export const CompanyFormGroup = () => {
    const { formData, handleChange, handleSelect, handleClearSelection } =
        useGetStartedForm();
    
    // Guard: this step only renders when formData exists
    if (!formData) return null;
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
              <div className="form-group">
                <label htmlFor="location">Location</label>
                <input
                  type="text"
                  name="location"
                  value={(formData.data as any).location ?? ""}
                  onChange={handleChange}
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