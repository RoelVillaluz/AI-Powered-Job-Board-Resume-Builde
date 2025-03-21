import { Link } from "react-router-dom"

    const calculateWorkExperienceCount = () => {
        const workExperience = example.workExperience;

        if (workExperience.length == 0) {
            return 0
        }

        let totalYears = 0

        for (let i = 0; i < workExperience.length; i++) {
            const startYear = new Date(workExperience[i].startDate);
            const endYear = workExperience[i].endDate ? new Date(workExperience[i].endDate) : new Date()

            // Calculate the difference in years
            let yearsWorked = endYear.getFullYear() - startYear.getFullYear();

            // Adjust for months (if the end month is before the start month, subtract 1)
            const startMonth = startYear.getMonth();
            const endMonth = endYear.getMonth();
            if (endMonth < startMonth) {
                yearsWorked--;
            }

            totalYears += yearsWorked;
        }

        return totalYears
    }

    console.log("Total Work Experience (in years):", calculateWorkExperienceCount());


    return (
        <section className={`grid-item ${!loading ? '' : 'skeleton'}`} id="salary-prediction">
            {!loading && (
                <>
                <header>
                    <div className="wrapper">
                        <i className="fa-solid fa-money-bill-1-wave"></i>
                        <h3>Estimated Salary</h3>
                    </div>
                    <Link to={'/salary-predictor'} aria-label="Link to user's salary prediction">
                        <i className="fa-solid fa-arrow-right" aria-hidden="true"></i>
                    </Link>
                </header>
                <div className="details">
                    <h1>No data yet</h1>
                    <p>Please complete your resume to gain more accurate prediction.</p>
                    <div className="stats-list">
                        <div className="stat">
                            <h4>0 Skills</h4>
                            <p>No skills yet.</p>
                        </div>
                        <div className="stat">
                            <h4>0 years</h4>
                            <p>Work Experience</p>
                        </div>
                        <div className="stat">
                            <h4>Philippines</h4>
                            <p>Location</p>
                        </div>
                    </div>
                </div>
                </>
            )}
        </section>
    )
}

export default SalaryPredictionSection