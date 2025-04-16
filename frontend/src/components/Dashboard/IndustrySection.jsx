import { useEffect, useState } from "react"
import { industryChoices } from "../../../../backend/constants"

function IndustrySection ({ formData, handleChange }) {
    const [selectedIndustries, setSelectedIndustries] = useState(formData.industry || [])

    const addOrRemoveIndustry = (industry) => {
        
        const updatedIndustries = selectedIndustries.includes(industry) 
            ? selectedIndustries.filter((i) => i !== industry)
            : [...selectedIndustries, industry]

        setSelectedIndustries(updatedIndustries)

        handleChange({
            target: {
                name: "industry",
                value: updatedIndustries
            }
        })
    }

    useEffect(() => {
        if (formData.industry && Array.isArray(formData.industry)) {
            setSelectedIndustries(formData.industry)
        }
    }, [formData.industry])

    useEffect(() => {
        console.log('Form Data Industries: ', formData.industry)
    }, [formData.industry])

    return (
        <section className="company-industry">
            <header>
                <h3>Select Your Industry</h3>
                <p>Please choose the industry that best represents your company.</p>
            </header>
            <div className="choice-buttons" id="industry-choice-buttons">
                {Object.entries(industryChoices).sort(([a], [b]) => a.localeCompare(b)).map(([industry, iconClass], index) => (
                    <div className={`choice-button ${selectedIndustries.some((i) => i === industry) ? 'selected' : ''}`} key={index} onClick={() => addOrRemoveIndustry(industry)}>
                        <i className={iconClass}></i>
                        <label htmlFor="">{industry}</label>
                    </div>
                ))}
            </div>
        </section>
    )
}

export default IndustrySection