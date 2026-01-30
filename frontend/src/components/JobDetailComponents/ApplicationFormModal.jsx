import { useState } from "react"

function ApplicationFormModal({ job, onClose, onSubmit }) {
    const [answers, setAnswers] = useState({})

    const handleChange = (index, value) => {
        setAnswers(prev => ({
            ...prev,
            [index]: value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(answers),
        onClose()
    }

    return (
        <div className="blurry-overlay">
            <div className="application-form-container">

                <div className="image-container">
                    <img src="/media/pexels-cytonn-955389.jpg" alt="" />
                </div>

                <form onSubmit={handleSubmit} className="application-form-modal">

                    <header>
                        <div className="row">
                            <h1>Apply for this role</h1>
                            <button type="button" id="close-btn" onClick={onClose}>
                                <i className="fa-solid fa-xmark"></i>
                            </button>
                        </div>
                        <h3>{job?.title} - {job?.company.name}</h3>
                    </header>

                    {job?.preScreeningQuestions.map((question, index) => (
                        <div className="form-group" key={index}>
                            <label>{question.question}</label>
                            <input
                                type="text"
                                value={answers[index] || ""}
                                onChange={(e) => handleChange(index, e.target.value)}
                            />
                        </div>
                    ))}
                    <button type="submit">Submit</button>
                </form>

            </div>
        </div>
    )

}

export default ApplicationFormModal