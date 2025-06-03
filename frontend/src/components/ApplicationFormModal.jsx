function ApplicationFormModal({ job }) {

    return (
        <div className="blurry-overlay">
            <div className="application-form-container">
                <div className="image-container">
                    <img src="/media/pexels-cytonn-955389.jpg" alt="" />
                </div>
                <form action="" className="application-form-modal">
                    <header>
                        <h1>Apply for this role</h1>
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