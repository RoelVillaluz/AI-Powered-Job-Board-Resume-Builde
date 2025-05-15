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

    const getFilteredOptions = (options, selectedValue) => {
        return options.filter((option, index) => {
            // If nothing selected yet, skip the first item (index 0)
            if (!selectedValue && index === 0) return false;
            // Always skip the currently selected value
            return option !== selectedValue;
        });
    };

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
                        {/* Job Type */}
                        <label>Job Type</label>
                        <input type="text" name="jobType" value={formData.jobType} onChange={handleChange}/>
                    </div>
                    <div className="form-group">
                        {/* Experience Level */}
                        <label>Experience Level</label>
                        <input type="text" name="experienceLevel" value={formData.experienceLevel} onChange={handleChange}/>
                    </div>
                    <div className="form-group">
                        {/* Salary */}
                        <label>Salary</label>
                        <div className="salary-group">

                            <ul className="select-menu">
                                <li onClick={() => toggleVisibility("salaryDropdown")} className="selected">
                                    <i className={`fa-solid ${selectedCurrency.icon}`}></i>
                                </li>
                                <div className={`dropdown-list ${isVisible.salaryDropdown ? 'visible' : ''}`}>
                                    {options.currencyOptions.filter(currency => currency !== selectedCurrency).map((currency, index) => (
                                        <li key={index} onClick={() => { 
                                                handleChange({ target: { name: "salary.currency", value: currency.value } }) 
                                                toggleVisibility("salaryDropdown")
                                            }}>
                                            <i className={`fa-solid ${currency.icon}`} value={currency.value}></i>
                                        </li>
                                    ))}
                                </div>
                            </ul>    

                            <input type="number" name="salary.amount" value={formData.salary.amount} onChange={handleChange}/>      

                            <ul className="select-menu">
                                <li onClick={() => toggleVisibility("frequencyDropdown")} className="selected">
                                    {selectedFrequency}
                                </li>
                                <div className={`dropdown-list ${isVisible.frequencyDropdown ? 'visible': ''}`}>
                                    {options.frequencyOptions.filter(option => option !== selectedFrequency).map((option, index) => (
                                        <li key={index} onClick={() => {
                                            handleChange({ target: { name: "salary.frequency", value: option } })
                                            toggleVisibility("frequencyDropdown")
                                        }}>
                                            {option}
                                        </li>
                                    ))}
                                </div>
                            </ul>          
                        </div>
                    </div>
                </div>
            </section>
        </>
    )
}

export default JobDetailsSection