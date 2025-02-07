function UserDetailsSection ({ selectedRole }) {
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
                {selectedRole === 'jobseeker' && (
                    <>
                    <div className="row">
                        <div className="form-group">
                            <label>First Name</label>
                            <input type="text" />
                        </div>
                        <div className="form-group">
                            <label>Last Name</label>
                            <input type="text" />
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Phone</label>
                        <input type="text" />
                    </div>
                    <div className="form-group">
                        <label>Address</label>
                        <input type="text" />
                    </div>
                    <div className="form-group">
                        <label>Social Media</label>
                        <div className="row">
                            <div className="wrapper">
                                <i class="fa-brands fa-facebook"></i>
                                <input type="text" />
                            </div>
                            <div className="wrapper">
                                <i class="fa-brands fa-linkedin"></i>
                                <input type="text" />
                            </div>
                        </div>
                        <div className="row">
                            <div className="wrapper">
                                <i class="fa-brands fa-github"></i>
                                <input type="text" />
                            </div>
                            <div className="wrapper">
                                <i class="fa-solid fa-globe"></i>
                                <input type="text" />
                            </div>
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Summary</label>
                        <textarea name="" id=""></textarea>
                    </div>
                    </>
                )}
            </div>
        </section>
    )
}

export default UserDetailsSection