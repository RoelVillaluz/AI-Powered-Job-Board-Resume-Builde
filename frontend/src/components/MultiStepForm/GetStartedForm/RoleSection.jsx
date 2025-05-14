function RoleSection ({ selectedRole, setSelectedRole }) {
    return (
        <section className="select-role">
            <header>
                <h3>Let's start with your role!</h3>    
                <p>Tell us what position you're looking for.</p>
            </header>
            <div className="choice-buttons">
                <div className={`choice-button ${selectedRole === 'jobseeker' ? 'selected': ''}`}
                    onClick={() => setSelectedRole("jobseeker")}>
                        <i className="fa-solid fa-magnifying-glass"></i>
                        <label htmlFor="role-radio-btn">Jobseeker</label>
                        <input type="radio" name="role" id="role-radio-btn" checked={selectedRole === 'jobseeker'} readOnly />
                        <div className="checked-indicator">
                            <i className="fa-solid fa-check"></i>
                        </div>
                </div>
                <div className={`choice-button ${selectedRole === 'employer' ? 'selected' : ''}`}
                    onClick={() => setSelectedRole("employer")}>
                        <i className="fa-solid fa-building"></i>
                        <label htmlFor="role-radio-btn">Employer</label>
                        <input type="radio" name="role" id="role-radio-btn" checked={selectedRole === 'employer'} readOnly />
                        <div className="checked-indicator">
                            <i className="fa-solid fa-check"></i>
                        </div>
                </div>
            </div>
        </section>
    )
}

export default RoleSection