import { useState } from "react"

function JobDetailsSection({ formData, setFormData, handleChange }) {
    const [isVisible, setIsVisible] = useState(false);
    const options = {
        jobTypeOptions: ['Full-Time', 'Part-Time', 'Contract', 'Internship'],
        experienceLevelOptions: ['Intern', 'Entry', 'Mid-Level', 'Senior'],

        // Salary object options
        currencyOptions: [
            { icon: 'fa-dollar-sign', value: '$' },
            { icon: 'fa-peso-sign', value: '₱' },
            { icon: 'fa-euro-sign', value: '€' },
            { icon: 'fa-yen-sign', value: '¥' },
            { icon: 'fa-sterling-sign', value: '£' }
        ],
        frequencyOptions: ['hour', 'day', 'week', 'month', 'year']
    }
    
    return (
        <>
            <section id="job-posting-details">
                <header>
                    <h3>Job Info</h3>
                    <p>Let’s get the basics down. Add the job title and other important details!</p>
                </header>
                <div className="form-details">
                    <div className="row">
                        <div className="form-group">
                            <label>Job Title</label>
                            <input type="text" name="title" value={formData.title} onChange={handleChange}/>
                        </div>
                        <div className="form-group">
                            <label>Location</label>
                            <input type="text" name="location" value={formData.location} onChange={handleChange}/>
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Job Type</label>
                        <input type="text" name="jobType" value={formData.jobType} onChange={handleChange}/>
                    </div>
                    <div className="form-group">
                        <label>Experience Level</label>
                        <input type="text" name="experienceLevel" value={formData.experienceLevel} onChange={handleChange}/>
                    </div>
                    <div className="form-group">
                        <label>Salary</label>
                        <div className="salary-group">
                            <ul name="" id="" className="select-menu" onClick={() => setIsVisible(!isVisible)}>
                                <li>
                                    <i className={`fa-solid ${options.currency.icons[0]}`}></i>
                                </li>
                                {Array.from(options.currency.icons).slice(1).map((icon, index) => (
                                    <li key={index}>
                                        <i className={`fa-solid ${icon}`}></i>
                                    </li>
                                ))}
                                {/* {Object.entries()} */}
                            </ul>                            
                        </div>
                    </div>
                </div>
            </section>
        </>
    )
}

export default JobDetailsSection