import { useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { useAuthStore } from "../../stores/authStore";
import { useInteractedJobs } from "../../hooks/jobs/useJobQueries";

function ApplicationProgressSection() {
    const user = useAuthStore(state => state.user);

    const { data: interactedJobs = [], isLoading, error }
        = useInteractedJobs(user._id)

    const appliedJobs = interactedJobs.appliedJobs ?? []
    const savedJobs = interactedJobs.savedJobs ?? []

    const [showOngoing, setShowOngoing] = useState(true);

    const statusOptions = [
        { key: true, label: "Ongoing", statuses: ['Pending', 'Reviewed', 'Interviewing'] },
        { key: false, label: "Completed" }
    ]

    const applicationStatuses = status => status 
    ? ['Pending', 'Reviewed', 'Interviewing'] 
    : ['Accepted', 'Rejected'];

    return(
        <>
            <section className={`grid-item ${isLoading !== true ? '' : 'skeleton'}`} id="application-progress">
                {isLoading !== true && (
                    <>
                        {appliedJobs.length > 0 ? (
                            <Swiper 
                                modules={[Pagination]}  
                                pagination={{ clickable: true }}  
                                spaceBetween={10}
                                slidesPerView={1}
                                style={{ width: "100%", height: "100%", paddingBottom: "2rem" }}
                                loop={true}
                            >
                                {appliedJobs
                                    .filter(application => applicationStatuses(showOngoing).includes(application.status))
                                    .map((application, index) => {
                                        const statuses = applicationStatuses(showOngoing); 
                                        const totalStages = 4;

                                        let stageNumber;
                                        if (application.status === "Accepted") {
                                            stageNumber = 4; // Final stage
                                        } else if (application.status === "Rejected") {
                                            stageNumber = 1; // Automatically set to first stage
                                        } else {
                                            stageNumber = statuses.indexOf(application.status) + 1;
                                        }

                                        return (
                                            <SwiperSlide key={index}>
                                                <header>
                                                    <div className="job">
                                                        <img src={application.jobPosting.company.logo} alt={`${application.jobPosting.company.name} logo`} />
                                                        <div>
                                                            <h3>{application.jobPosting.title}</h3>
                                                            <p>{application.jobPosting.company.name}</p>
                                                        </div>
                                                    </div>
                                                    <div className="status" aria-live="polite">
                                                        <span>Ongoing</span>
                                                    </div>
                                                </header>

                                                <div className="details">
                                                    <div className="stage">
                                                        <span>Stage {stageNumber}/{totalStages}</span>
                                                        <h1>{application.status}</h1>
                                                    </div>
                                                    <div className="time">
                                                        <p>
                                                        Submitted <time dateTime={application.appliedAt}>
                                                            {new Intl.DateTimeFormat("en-US", {
                                                            year: "numeric",
                                                            month: "long",
                                                            day: "numeric",
                                                            hour: "numeric",
                                                            minute: "2-digit",
                                                            hour12: true,
                                                            }).format(new Date(application.appliedAt))}
                                                        </time>
                                                        </p>
                                                    </div>
                                                </div>
                                            </SwiperSlide>
                                        );
                                    })
                                }
                            </Swiper>
                        ) : (
                            <>
                                <header aria-hidden="true" className="decorative-header"></header>
                                <div role="alert" className="empty-status">
                                    <i className="fas fa-box-open" aria-label="No job applications"></i>
                                    <span>{showOngoing ? 'No job applications yet.' : 'No completed jobs yet.'}</span>
                                </div>
                            </>
                        )}
                        <div className="status-toggle-buttons">
                            {statusOptions.map(({ key, label }) => (
                                <button 
                                    type="button" 
                                    className={showOngoing === key ? 'active' : ''} 
                                    key={key} 
                                    aria-label={`Show ${label}`}
                                    onClick={() => setShowOngoing(key)}
                                    >
                                        {label} ({appliedJobs.filter(job => applicationStatuses(key).includes(job.status)).length})
                                </button>
                            ))}
                        </div>
                    </>

                )}
            </section>
        </>
    )
}

export default ApplicationProgressSection