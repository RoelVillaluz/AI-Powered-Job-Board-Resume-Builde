import { Link } from "react-router-dom"

function SalaryPredictionSection() {
    return (
        <>
            <section className="grid-item" id="salary-prediction">
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
            </section>
        </>
    )
}

export default SalaryPredictionSection