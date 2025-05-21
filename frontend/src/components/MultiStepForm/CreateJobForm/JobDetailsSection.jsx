import { useEffect, useState } from "react"
import DynamicInputWithDropdown from "../../FormComponents/DynamicInputWithDropdown";

function JobDetailsSection({ formData, setFormData, handleChange }) {
    const formTypes = {
        jobType: {
            label: "Job Type",
            hasDropDown: true,
            dropDownName: "jobTypeDropdown",
            dropDownField: 'jobType',
            options: ['Full-Time', 'Part-Time', 'Contract', 'Internship'],
            readOnly: true, // ensures user cant type directly and field can only change through dropdown select
            updateFormOnClick: true, // ensures once user clicks on dropdown item, it instantly updates form data without clicking enter
        },
        experienceLevel: {
            label: "Experience Level",
            hasDropDown: true,
            dropDownName: "experienceDropdown",
            dropDownField: 'experienceLevel',
            options: ['Intern', 'Entry', 'Mid-Level', 'Senior'],
            readOnly: true,
            updateFormOnClick: true,
        },
    }

    const [inputs, setInputs] = useState({
        jobType: '',
        experienceLevel: ''
    })
 
    const [isVisible, setIsVisible] = useState({
        jobTypeDropdown: false,
        experienceDropdown: false,
        salaryDropdown: false,
        frequencyDropdown: false,
    });

    const handleInputChange = (e, name) => {
        setInputs(prev => ({ ...prev, [name]: e.target.value }))
    }

    const options = {
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

    const selectedCurrency = options.currencyOptions.find(c => c.value === formData.salary.currency) || { icon: '' };

    const getFilteredOptions = (options, selectedValue, key = null) => {
        return options.filter((option, index) => {
            if (!selectedValue && index === 0) return false;
            
            if (key) {
                return option[key] !== selectedValue;
            }
            return option !== selectedValue;
        });
    };

    const toggleVisibility = (dropdown) => {
        setIsVisible((prevState) => {
            const updatedState = {}
            Object.keys(prevState).forEach((key) => {
                updatedState[key] = key === dropdown ? !prevState[key] : false;
            })
            return updatedState
        })
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
                    
                    {Object.entries(formTypes).map(([name, config]) => (
                        <DynamicInputWithDropdown
                            key={name}
                            config={config}
                            name={name}
                            inputs={inputs}
                            handleInputChange={handleInputChange}
                            setInputs={setInputs}
                            isVisible={isVisible}
                            toggleVisibility={toggleVisibility}
                            getFilteredOptions={getFilteredOptions}
                            setFormData={setFormData}
                        />
                    ))}

                    {/* Salary */}
                    <div className="form-group">
                        <label>Salary</label>
                        <div className="salary-group">

                            <ul className="select-menu">
                                <button onClick={() => toggleVisibility("salaryDropdown")} className="toggle-dropdown-btn" type="button">
                                    <i className={`fa-solid ${selectedCurrency.icon}`}></i>
                                </button>
                                <ul className={`dropdown-list ${isVisible.salaryDropdown ? 'visible' : ''}`}>
                                    {getFilteredOptions(options.currencyOptions, formData.salary.currency, 'value').map((currency, index) => (
                                        <li key={index} onClick={() => { 
                                            handleChange({ target: { name: "salary.currency", value: currency.value } });
                                            toggleVisibility("salaryDropdown");
                                        }}>
                                            <i className={`fa-solid ${currency.icon}`} value={currency.value}></i>
                                        </li>
                                    ))}
                                </ul>
                            </ul>    

                            <input type="number" name="salary.amount" value={formData.salary.amount} onChange={handleChange}/>      

                            <ul className="select-menu">
                                <button onClick={() => toggleVisibility("frequencyDropdown")} className="toggle-dropdown-btn" type="button">
                                    {formData.salary.frequency}
                                    <i className="fa-solid fa-angle-down"></i>
                                </button>
                                <div className={`dropdown-list ${isVisible.frequencyDropdown ? 'visible': ''}`}>
                                    {getFilteredOptions(options.frequencyOptions, formData.salary.frequency).map((option, index) => (
                                        <li key={index} onClick={() => {
                                            handleChange({ target: { name: "salary.frequency", value: option } })
                                            toggleVisibility("frequencyDropdown")
                                        }}>
                                            <span className="option-text">{option}</span>
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