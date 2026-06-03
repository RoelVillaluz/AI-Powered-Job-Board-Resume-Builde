import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useResumeStore } from "../../stores/resumeStore";
import { useResumeSalaryPrediction } from "../../hooks/resumes/useResumeSalaryPrediction";

function SalaryPredictionSection() {
    const isLoading = useResumeStore(state => state.isLoading);
    const { predictedSalary, isGenerating, statusMessage } = useResumeSalaryPrediction();

    const formatSalary = (salary) => {
        const rounded = Math.ceil(salary / 100) * 100;
        return rounded.toLocaleString();
    };

    const showSkeleton = isLoading || isGenerating;

    return (
        <section
            className={`grid-item ${showSkeleton ? "skeleton" : ""}`}
            id="salary-prediction"
        >
            {!isLoading && (
                <>
                    <header>
                        <div className="wrapper">
                            <i className="fa-solid fa-money-bill-1-wave"></i>
                            <h3>Estimated Salary</h3>
                        </div>
                        <Link to="/salary-predictor" aria-label="Link to salary prediction">
                            <i className="fa-solid fa-arrow-right" />
                        </Link>
                    </header>

                    <div className="details">
                        {isGenerating ? (
                            <>
                                <h1>Calculating...</h1>
                                <p>{statusMessage ?? "Analyzing your resume and market data..."}</p>
                            </>
                        ) : (
                            <>
                                <h1>
                                    {predictedSalary
                                        ? `$${formatSalary(predictedSalary.predictedYearly)} annually`
                                        : "No Data Yet"}
                                </h1>
                                <p>
                                    {predictedSalary
                                        ? "Salaries vary based on experience, skills, and market demand."
                                        : "Please complete your resume to gain more accurate prediction."}
                                </p>
                                <div className="stats-list">
                                    <div className="stat">
                                        <h4>{predictedSalary?.location?.location_name}</h4>
                                        <p>Location</p>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </>
            )}
        </section>
    );
}

export default SalaryPredictionSection;