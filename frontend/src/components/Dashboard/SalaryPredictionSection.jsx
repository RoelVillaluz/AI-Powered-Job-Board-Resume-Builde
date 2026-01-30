import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import axios from "axios";
import { BASE_API_URL } from "../../config/api";
import { useResumeStore } from "../../stores/resumeStore";

function SalaryPredictionSection() {
    const resume = useResumeStore(state => state.currentResume);
    const isLoading = useResumeStore(state => state.isLoading)
    const [predictedSalary, setPredictedSalary] = useState(0);
    const [shuffledSkills, setShuffledSkills] = useState([]);

    const example = {
        workExperience: [
            {
                jobTitle: "Software Engineer",
                company: "TechCorp",
                startDate: "2015-06-01",  // Start date in YYYY-MM-DD format
                endDate: "2018-12-31",    // End date in YYYY-MM-DD format
                responsibilities: "Developed web applications and maintained databases."
            },
            {
                jobTitle: "Senior Software Engineer",
                company: "WebWorks",
                startDate: "2019-01-01",
                endDate: "2022-08-15",    // End date in YYYY-MM-DD format
                responsibilities: "Led a team of developers to create enterprise solutions."
            },
            {
                jobTitle: "Lead Developer",
                company: "AppSolutions",
                startDate: "2023-05-01",
                endDate: "",              // No end date, indicating the person is currently employed
                responsibilities: "Managing product development and ensuring timely delivery."
            }
        ]
    };
    

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

    useEffect(() => {
        const getPredictedSalary = async () => {
            try {
                const response = await axios.get(`${BASE_API_URL}/ai/predicted-salary/${resume._id}`)
                console.log('Predicted Salary:', response.data)
                setPredictedSalary(response.data.predictedSalary)
            } catch (error) {
                console.log('Error:', error)
            }
        }
        getPredictedSalary()
    })

    const formatSalary = (salary) => {
        const formattedSalary = Math.ceil(salary / 100) * 100
        return formattedSalary.toLocaleString()
    }

    useEffect(() => {
        if (resume?.skills.length) {
            const shuffled = resume.skills.sort(() => Math.random() - 0.5).slice(0, 3).map(skill => skill.name).join(", ")
            setShuffledSkills(shuffled)
        }
    }, [resume])

    return (
        <section className={`grid-item ${!isLoading ? '' : 'skeleton'}`} id="salary-prediction">
            {!isLoading && (
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
                    <h1>{predictedSalary !== 0 ? `$${formatSalary(predictedSalary)}` : 'No Data Yet'}</h1>
                    {predictedSalary === 0 ? (
                        <p>Please complete your resume to gain more accurate prediction.</p>
                    ) : (
                        <p>Salaries vary based on experience, location, and industry demand.</p>
                    )}
                    <div className="stats-list">
                        <div className="stat">
                            <h4>{resume?.skills.length} Skills</h4>
                            {resume && shuffledSkills ? (
                                <p>{shuffledSkills}</p>
                            ) : (
                                <p>No skills yet.</p>
                            )}
                        </div>
                        <div className="stat">
                            <h4>{calculateWorkExperienceCount()} years</h4>
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