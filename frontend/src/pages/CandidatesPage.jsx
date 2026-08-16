import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { useJobCandidates } from "../hooks/jobs/useJobQueries";
import { useAuthStore } from "../stores/authStore";
import Layout from "../components/Layout";

const statusColors = {
    Pending:     { bg: "#fff3cd", color: "#856404" },
    Reviewed:    { bg: "#cce5ff", color: "#004085" },
    Interviewing: { bg: "#d4edda", color: "#155724" },
    Accepted:    { bg: "#d4edda", color: "#155724" },
    Rejected:    { bg: "#f8d7da", color: "#721c24" },
};

const formatDate = (dateStr) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
};

const CandidatesPage = () => {
    const { jobId } = useParams();
    const token = useAuthStore((state) => state.token);
    const user = useAuthStore((state) => state.user);
    const { data, isLoading, error } = useJobCandidates(jobId, token);

    useEffect(() => {
        document.title = "Candidates";
    }, []);

    if (isLoading) {
        return (
            <Layout>
                <div className="content">
                    <h1>Candidates</h1>
                    <div className="job-list-grid">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="skeleton card" />
                        ))}
                    </div>
                </div>
            </Layout>
        );
    }

    if (error) {
        return (
            <Layout>
                <div className="content">
                    <h1>Candidates</h1>
                    <p>Failed to load candidates. Please try again later.</p>
                </div>
            </Layout>
        );
    }

    if (!data) {
        return (
            <Layout>
                <div className="content">
                    <h1>Candidates</h1>
                    <p>Job posting not found.</p>
                </div>
            </Layout>
        );
    }

    const { job, applicants } = data;
    const jobTitle = job.title?.name || job.title || "Untitled";
    const companyName = job.company?.name || "Unknown Company";

    return (
        <Layout>
            <div className="content">
                <div className="wrapper" style={{ marginBottom: "1.5rem", alignItems: "baseline", gap: "0.75rem" }}>
                    <h1 style={{ margin: 0 }}>{jobTitle}</h1>
                    <h2 style={{ margin: 0, fontSize: "1.1rem", color: "#666" }}>{companyName}</h2>
                    <span style={{ marginLeft: "auto", color: "#666" }}>
                        {applicants.length} applicant{applicants.length !== 1 ? "s" : ""}
                    </span>
                </div>

                {applicants.length === 0 ? (
                    <p>No applicants yet.</p>
                ) : (
                    <ul className="job-list-grid">
                        {applicants.map((app) => {
                            const { applicant: a, resume: r, status, appliedAt } = app;
                            const name = a
                                ? `${a.firstName || ""} ${a.lastName || ""}`.trim()
                                : r
                                ? `${r.firstName || ""} ${r.lastName || ""}`.trim()
                                : "Unknown";
                            const email = a?.email || "";
                            const summary = r?.summary || "";
                            const skills = r?.skills || [];
                            const statusStyle = statusColors[status] || {};

                            return (
                                <li key={app._id || a?._id} className="job-card">
                                    <div className="wrapper">
                                        {a?.profilePicture ? (
                                            <img
                                                src={a.profilePicture}
                                                alt={name}
                                                style={{
                                                    width: "48px",
                                                    height: "48px",
                                                    borderRadius: "50%",
                                                    objectFit: "cover",
                                                }}
                                            />
                                        ) : (
                                            <div
                                                className="icon-box"
                                                style={{
                                                    width: "48px",
                                                    height: "48px",
                                                    borderRadius: "50%",
                                                }}
                                            >
                                                <i className="fa-solid fa-user" />
                                            </div>
                                        )}
                                        <div>
                                            <h2 style={{ margin: 0, fontSize: "1rem" }}>{name}</h2>
                                            {email && (
                                                <h3 style={{ margin: "0.25rem 0 0", fontSize: "0.85rem", color: "#666" }}>
                                                    {email}
                                                </h3>
                                            )}
                                        </div>
                                    </div>

                                    {summary && (
                                        <p style={{ fontSize: "0.85rem", color: "#555", margin: "0.75rem 0" }}>
                                            {summary.length > 150
                                                ? `${summary.slice(0, 150)}...`
                                                : summary}
                                        </p>
                                    )}

                                    <div className="details">
                                        {skills.length > 0 && (
                                            <div className="tags-list">
                                                {skills.slice(0, 5).map((skill, i) => (
                                                    <div key={i} className="tag-item">
                                                        <i className="fa-solid fa-code" />
                                                        <span>{skill.name}</span>
                                                    </div>
                                                ))}
                                                {skills.length > 5 && (
                                                    <div className="tag-item">
                                                        <span>+{skills.length - 5} more</span>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    <div className="actions" style={{ marginTop: "0.75rem" }}>
                                        <span
                                            style={{
                                                padding: "0.25rem 0.75rem",
                                                borderRadius: "12px",
                                                fontSize: "0.8rem",
                                                fontWeight: 600,
                                                ...statusStyle,
                                            }}
                                        >
                                            {status}
                                        </span>
                                        <span style={{ fontSize: "0.8rem", color: "#888" }}>
                                            Applied {formatDate(appliedAt)}
                                        </span>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>
        </Layout>
    );
};

export default CandidatesPage;
