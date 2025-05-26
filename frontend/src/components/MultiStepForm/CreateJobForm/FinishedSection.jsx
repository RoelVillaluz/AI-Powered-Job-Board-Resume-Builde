function FinishedSection({ formData }) {

    const formatSalary = (salary) => {
        return `${salary.currency}${salary.amount || '0'} per ${salary.frequency}`
    }

    return (
       <section id="finished">
            <header>
                <h3>Ready to Post Your Job?</h3>
                <p>Just hit submit to create the job.</p>
            </header>

            <div className="form-group">
                <dl className="job-form-summary">

                    <div className="column left">

                        <div className="title-value-pair">
                            <dt>Job Title: </dt>
                            <dd>{formData.title || '-'}</dd>
                        </div>

                        <div className="title-value-pair">
                            <dt>Job Type: </dt>
                            <dd>{formData.jobType || '-'}</dd>
                        </div>

                        <div className="title-value-pair">
                            <dt>Salary: </dt>
                            <dd>{formatSalary(formData.salary)}</dd>
                        </div>

                        <div className="title-value-pair">
                            <dt>Skills: </dt>
                            <dd>{formData.skills.length} skills</dd>
                        </div>

                    </div>

                    <div className="column right">

                        <div className="title-value-pair">
                            <dt>Location: </dt>
                            <dd>{formData.location || '-'}</dd>
                        </div>

                        <div className="title-value-pair">
                            <dt>Experience Level: </dt>
                            <dd>{formData.experienceLevel || '-'}</dd>
                        </div>

                        <div className="title-value-pair">
                            <dt>Requirements: </dt>
                            <dd>{formData.requirements.length} requirements</dd>
                        </div>

                        <div className="title-value-pair">
                            <dt>Pre-screening Questions: </dt>
                            <dd>{formData.preScreeningQuestions.length} Questions</dd>
                        </div>

                    </div>


                </dl>
            </div>

        </section>
    )
}

export default FinishedSection