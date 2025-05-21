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

                </div>
            </section>
        </>
    )
}

export default JobDetailsSection