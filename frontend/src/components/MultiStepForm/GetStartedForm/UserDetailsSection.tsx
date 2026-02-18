import type { GetStartedFormData, UserRole } from "../../../../types/forms/getStartedForm.types";

interface UserDetailsSectionProps {
    selectedRole: UserRole;
    formData: GetStartedFormData;
    handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}

function UserDetailsSection({ selectedRole, formData, handleChange }: UserDetailsSectionProps) {
    // Type guard to ensure correct data access
    const isJobseeker = formData.role === "jobseeker";
    const isEmployer = formData.role === "employer";

    return (
        <section className="user-details">
            <header>
                <h3>
                    {selectedRole === "jobseeker"
                        ? "A little about you!"
                        : "Tell us about your company!"}
                </h3>
                <p>
                    {selectedRole === "jobseeker"
                        ? "Fill in some basic details to help employers get to know you better."
                        : "Provide key details about your organization to attract the right talent."}
                </p>
            </header>
            <div className="form-details">
                {isJobseeker && (
                    <>
                        <div className="row">
                            <div className="form-group">
                                <label>First Name</label>
                                <input
                                    type="text"
                                    name="firstName"
                                    value={formData.data.firstName || ""}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="form-group">
                                <label>Last Name</label>
                                <input
                                    type="text"
                                    name="lastName"
                                    value={formData.data.lastName || ""}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Phone</label>
                            <input
                                type="text"
                                name="phone"
                                value={formData.data.phone || ""}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="form-group">
                            <label>Address</label>
                            <input
                                type="text"
                                name="address"
                                value={formData.data.address || ""}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="form-group">
                            <label>Social Media</label>
                            <div className="row">
                                <div className="wrapper">
                                    <i className="fa-brands fa-facebook"></i>
                                    <input
                                        type="text"
                                        name="socialMedia.facebook"
                                        value={formData.data.socialMedia?.facebook || ""}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="wrapper">
                                    <i className="fa-brands fa-linkedin"></i>
                                    <input
                                        type="text"
                                        name="socialMedia.linkedIn"
                                        value={formData.data.socialMedia?.linkedIn || ""}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>
                            <div className="row">
                                <div className="wrapper">
                                    <i className="fa-brands fa-github"></i>
                                    <input
                                        type="text"
                                        name="socialMedia.github"
                                        value={formData.data.socialMedia?.github || ""}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="wrapper">
                                    <i className="fa-solid fa-globe"></i>
                                    <input
                                        type="text"
                                        name="socialMedia.website"
                                        value={formData.data.socialMedia?.website || ""}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Summary</label>
                            <textarea
                                name="summary"
                                value={formData.data.summary || ""}
                                onChange={handleChange}
                            ></textarea>
                        </div>
                    </>
                )}

                {isEmployer && (
                    <>
                        <div className="row">
                            <div className="form-group">
                                <label htmlFor="name">Company Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.data.name || ""}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>
                        <div className="form-group">
                            <label htmlFor="location">Location</label>
                            <input
                                type="text"
                                name="location"
                                value={formData.data.location || ""}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="row">
                            <div className="form-group">
                                <label htmlFor="website">Website</label>
                                <input
                                    type="text"
                                    name="website"
                                    value={formData.data.website || ""}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="size">Size</label>
                                <input
                                    type="text"
                                    name="size"
                                    value={formData.data.size || ""}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>
                        <div className="form-group">
                            <label htmlFor="description">Description</label>
                            <textarea
                                name="description"
                                value={formData.data.description || ""}
                                onChange={handleChange}
                            ></textarea>
                        </div>
                    </>
                )}
            </div>
        </section>
    );
}

export default UserDetailsSection;