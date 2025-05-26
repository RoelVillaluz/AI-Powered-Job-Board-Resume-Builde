function FinishedSection({ formData }) {

    const stepsMap = {
        details: 0,
        SkillsAndRequirements: 1,
        questions: 2
    }

    const formatSalary = (salary) => {
        return `${salary.currency}${salary.amount || '0'} per ${salary.frequency}`
    }

    // Configuration for fields grouped by column, with a step reference for navigation
    const fields = {
        left: [
        {
            label: 'Job Title',
            value: formData.title || '-',
            step: stepsMap.details,
        },
        {
            label: 'Job Type',
            value: formData.jobType || '-',
            step: stepsMap.details,
        },
        {
            label: 'Salary',
            value: formatSalary(formData.salary),
            step: stepsMap.details,
        },
        {
            label: 'Skills',
            value: `${formData.skills.length} skills`,
            step: stepsMap.skillsAndRequirements,
        },
        ],
        right: [
        {
            label: 'Location',
            value: formData.location || '-',
            step: stepsMap.details,
        },
        {
            label: 'Experience Level',
            value: formData.experienceLevel || '-',
            step: stepsMap.details,
        },
        {
            label: 'Requirements',
            value: `${formData.requirements.length} requirements`,
            step: stepsMap.skillsAndRequirements,
        },
        {
            label: 'Pre-screening Questions',
            value: `${formData.preScreeningQuestions.length} Questions`,
            step: stepsMap.questions,
        },
        ],
    };

    return (
       <section id="finished">
            <header>
                <h3>Ready to Post Your Job?</h3>
                <p>Just hit submit to create the job.</p>
            </header>

            <div className="form-group">
                <dl className="job-form-summary">

                    <div className="column left">

                        {fields.left.map(({ label, value, step }) => (
                            <div className="title-value-pair">
                                <dt>{label}</dt>
                                <dd>{value}</dd>
                            </div>
                        ))}

                    </div>

                    <div className="column right">

                        {fields.right.map(({ label, value, step }) => (
                            <div className="title-value-pair">
                                <dt>{label}</dt>
                                <dd>{value}</dd>
                            </div>
                        ))}

                    </div>


                </dl>
            </div>

        </section>
    )
}

export default FinishedSection