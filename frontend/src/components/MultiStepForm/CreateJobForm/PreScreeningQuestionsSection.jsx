import { useState } from "react"

function PreScreeningQuestionsSection({ formData, setFormData, handleChange }) {
    const [isVisible, setIsVisible] = useState(false);
    const [inputs, setInputs] = useState({
        question: '',
        required: false // questions are not required to be answered by applicant by default
    })
    
    const options = {
        "Required": true,
        "Optional": false
    }

    const selectedRequiredValue = Object.entries(options).find(([key, value]) => value === inputs.required)?.[0]

    const handleInputChange = (e, name) => {
        setInputs(prev => ({ ...prev, [name]: e.target.value }))
    }

    const handleAddItem = (e, name) => {
        if (e.key === 'Enter' && inputs[name].trim()) {
            e.preventDefault();

            const currentList = [...formData.preScreeningQuestions];

            const newItem = { question: inputs[name].trim(), required: inputs.required };

            handleChange({
                target: {
                    name: 'preScreeningQuestions',
                    value: [...currentList, newItem]
                }
            })

            setInputs(prev => ({ ...prev, [name]: '' }))
        }
    }

    return (
        <section id="pre-screening-questions">
            <header>
                <h3>Pre Screening Questions (Optional)</h3>
            </header>

            <div className="form-details">

                <div className="form-group">
                    <textarea 
                        name="preScreeningQuestions.question" 
                        value={inputs.question} 
                        onChange={(e) => handleInputChange(e, 'question')}
                        onKeyDown={(e) => handleAddItem(e, 'question')}
                    >
                    </textarea>
                </div>

                <div className="row" style={{ alignItems: 'center' }}>
                    <span>Are applicants required to answer this question: </span>
                    <div className="select-menu">
                        <button 
                            aria-haspopup="listbox"
                            aria-expanded={isVisible}
                            onClick={() => setIsVisible((prev) => !prev)} 
                            className="toggle-dropdown-btn" 
                            type="button"
                        >
                            {selectedRequiredValue}
                            <i className="fa-solid fa-angle-down"></i>
                        </button>
                        <ul className={`dropdown-list ${isVisible ? 'visible' : ''}`}>
                            {Object.entries(options).filter(([label, value]) => value !== inputs.required).map(([label, value]) => (
                                <li key={label} onClick={(e) => {
                                    setInputs((prev) => ({ ...prev, required: value }))
                                    setIsVisible((prev) => !prev)
                                }}>
                                    <span className="option-text">{label}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>

        </section>
    )
}

export default PreScreeningQuestionsSection