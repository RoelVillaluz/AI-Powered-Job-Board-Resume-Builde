import { useState } from "react"

function PreScreeningQuestionsSection({ formData, setFormData, handleChange }) {
    const [isVisible, setIsVisible] = useState(false);
    const [inputs, setInputs] = useState({
        question: '',
        required: 'Optional' // questions are not required to be answered by applicant by default
    })
    
    const options = ["Required", "Optional"]

    const handleInputChange = (e, name) => {
        setInputs(prev => ({ ...prev, [name]: e.target.value }))
    }

    const handleAddItem = (e, name) => {
        if (e.key === 'Enter' && inputs[name].trim()) {
            e.preventDefault();

            const currentList = [];

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
                <h3>Pre Screening Questions</h3>
            </header>

            <div className="form-details">

                <div className="form-group">
                    <label>Pre-Screening Questions</label>
                    <textarea 
                        name="preScreeningQuestions.question" 
                        value={inputs.question} 
                        onChange={(e) => handleInputChange(e, 'question')}
                        onKeyDown={(e) => handleAddItem(e, 'question')}
                    >
                    </textarea>
                </div>

                <ul className="select-menu">
                    <button onClick={() => setIsVisible((prev) => !prev)} className="toggle-dropdown-btn" type="button">
                        {inputs.required}
                        <i className="fa-solid fa-angle-down"></i>
                    </button>
                    <ul className="dropdown-list">
                        
                    </ul>
                </ul>
            </div>

        </section>
    )
}

export default PreScreeningQuestionsSection