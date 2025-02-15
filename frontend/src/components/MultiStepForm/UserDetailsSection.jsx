function UserDetailsSection ({ selectedRole, formData, handleChange }) {
    return (
        <section className="user-details">
            <header>
                <h3>{selectedRole === 'jobseeker'
                    ? 'A little about you!'
                    : 'Tell us about your company!'
                    }</h3>
                <p>
                    {selectedRole === 'jobseeker'
                    ? 'Fill in some basic details to help employers get to know you better.'
                    : 'Provide key details about your organization to attract the right talent.'
                    }
                </p>
            </header>
            <div className="form-details">
                {selectedRole === 'jobseeker' ? (
                    <>
                    <div className="row">
                        <div className="form-group">
                            <label>First Name</label>
                            <input type="text" name="firstName" value={formData.firstName} onChange={handleChange}/>
                        </div>
                        <div className="form-group">
                            <label>Last Name</label>
                            <input type="text" name="lastName" value={formData.lastName} onChange={handleChange}/>
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Phone</label>
                        <input type="text" name="phone" value={formData.phone} onChange={handleChange}/>
                    </div>
                    <div className="form-group">
                        <label>Address</label>
                        <input type="text" name="address" value={formData.address} onChange={handleChange}/>
                    </div>
                    <div className="form-group">
                        <label>Social Media</label>
                        <div className="row">
                            <div className="wrapper">
                                <i className="fa-brands fa-facebook"></i>
                                <input type="text" name="socialMedia.facebook" value={formData.socialMedia.facebook} onChange={handleChange}/>
                            </div>
                            <div className="wrapper">
                                <i className="fa-brands fa-linkedin"></i>
                                <input type="text" name="socialMedia.linkedin" value={formData.socialMedia.linkedIn} onChange={handleChange}/>
                            </div>
                        </div>
                        <div className="row">
                            <div className="wrapper">
                                <i className="fa-brands fa-github"></i>
                                <input type="text" name="socialMedia.github" value={formData.socialMedia.github} onChange={handleChange}/>
                            </div>
                            <div className="wrapper">
                                <i className="fa-solid fa-globe"></i>
                                <input type="text" name="socialMedia.website" value={formData.socialMedia.website} onChange={handleChange}/>
                            </div>
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Summary</label>
                        <textarea name="summary" id="" value={formData.summary} onChange={handleChange}></textarea>
                    </div>
                    </>
                ) : (
                    <>
                        <div className="row">
                            <div className="form-group">
                                <label htmlFor="">Company Name</label>
                                <input type="text" name="name" value={formData.name} onChange={handleChange}/>
                            </div>
                            <div className="form-group">
                                <label htmlFor="">Industry</label>
                                <input type="text" name="industry" value={formData.industry} onChange={handleChange}/>
                            </div>
                        </div>
                        <div className="form-group">
                            <label htmlFor="">Location</label>
                            <input type="text" name="location" value={formData.location} onChange={handleChange}/>
                        </div>
                        <div className="row">
                            <div className="form-group">
                                <label htmlFor="">Website</label>
                                <input type="text" name="website" value={formData.value} onChange={handleChange}/>
                            </div>
                            <div className="form-group">
                                <label htmlFor="">Size</label>
                                <input type="number" name="size" value={formData.size} onChange={handleChange}/>
                            </div>
                        </div>
                        <div className="form-group">
                            <label htmlFor="">Description</label>
                            <textarea name="description" value={formData.description} onChange={handleChange}></textarea>
                        </div>
                    </>
                )}
            </div>
        </section>
    )
}

export default UserDetailsSection