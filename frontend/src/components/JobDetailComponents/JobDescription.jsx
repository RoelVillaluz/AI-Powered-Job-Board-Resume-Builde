import PropTypes from 'prop-types';

const DescriptionSkeleton = () => {
    return (
        <div className="skeleton-text-group" role="status" aria-label="Loading job description">
            <div className="skeleton text max-width"></div>
            <div className="skeleton text max-width"></div>
            <div className="skeleton text short"></div>
        </div>
    )
}

const RequirementsSkeleton = () => {
    return (
        <div className="skeleton-text-group">
            <div className="skeleton text long"></div>
            <div className="skeleton text long"></div>
        </div>
    )
}

function JobDescription({ job, loading = false }) {

    // Early return for loading state
    if (loading) {
        return (
        <section id="job-description" className="job-description">
            <div className="description-section">
                <h3>Description</h3>
                <DescriptionSkeleton />
            </div>
            <div className="requirements-section">
                <h3>Requirements</h3>
                <RequirementsSkeleton />
            </div>
        </section>
        );
    }

    // Error handling - if job is null/undefined
    if (!job) {
        return (
            <section id="job-description" className="job-description">
                <div className="error-message"> Unable to load job details. Please try again.</div>
            </section>
        );
    }

    // Safe array access
    const requirements = job.requirements || []
    const hasDescription = job.description && job.description.trim()

    return (
        <section id="job-description">

            <div>
                <h3>Description</h3>
                {hasDescription ? (
                    <p>{job.description}</p>
                ) : (
                    <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Perspiciatis facere laborum, impedit iusto fugit porro sequi sint vitae odio ut neque qui, esse mollitia. Corporis cumque veniam enim aliquid adipisci!</p>
                )}
            </div>

            <div>
                <h3>Requirements</h3>
                {requirements.length > 0 && (
                    <ul>
                        {requirements.map((req, index) => (
                            <li key={index}>{req}</li>
                        ))}
                    </ul>
                )}
            </div>

        </section>
    )
}

// PropTypes for development
JobDescription.PropTypes = {
    job: PropTypes.shape({
        description: PropTypes.string,
        requirements: PropTypes.arrayOf(PropTypes.string)
    }),
    loading: PropTypes.bool
}

export default JobDescription