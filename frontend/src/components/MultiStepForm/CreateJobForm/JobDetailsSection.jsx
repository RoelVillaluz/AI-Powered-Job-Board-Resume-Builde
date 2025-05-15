import { useState } from "react"

function JobDetailsSection({ formData, setFormData, handleChange }) {
    const [isVisible, setIsVisible] = useState({
        salaryDropdown: false,
        frequencyDropdown: false
    });
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

    const selectedCurrency = options.currencyOptions.find(c => c.value === formData.salary.currency);
    const selectedFrequency = options.frequencyOptions.find(f => f === formData.salary.frequency);

    const toggleVisibility = (dropdown) => {
        setIsVisible(prev => ({
            ...prev,
            [dropdown]: !prev[dropdown]
        }));
    };
    
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
                            <ul className="select-menu">
                                <li onClick={() => toggleVisibility("salaryDropdown")} className="selected">
                                    <i className={`fa-solid ${selectedCurrency.icon}`}></i>
                                </li>
                                <div className={`dropdown-list ${isVisible.salaryDropdown ? 'visible' : ''}`}>
                                    {options.currencyOptions.map((currency, index) => (
                                        <li key={index} onClick={() => { 
                                                handleChange({ target: { name: "salary.currency", value: currency.value } }) 
                                                toggleVisibility("salaryDropdown")
                                            }}>
                                            <i className={`fa-solid ${currency.icon}`} value={currency.value}></i>
                                        </li>
                                    ))}
                                </div>
                            <input type="number" name="salary.amount" value={formData.salary.amount} onChange={handleChange}/>      

                        </div>
                    </div>
                </div>
            </section>
        </>
    )
}

export default JobDetailsSection