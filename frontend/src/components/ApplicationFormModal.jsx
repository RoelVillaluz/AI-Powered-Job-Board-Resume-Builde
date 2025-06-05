function ApplicationFormModal({ job, onClose }) {

    return (
        <div className="blurry-overlay">
            <div className="application-form-container">

                <div className="image-container">
                    <img src="/media/pexels-cytonn-955389.jpg" alt="" />
                </div>

                <form action="" className="application-form-modal">

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
                        <div className="form-group">
                            <label htmlFor="" key={index}>{question.question}</label>
                            <input type="text" />
                        </div>
                    ))}
                </form>

            </div>
        </div>
    )

}

export default ApplicationFormModal