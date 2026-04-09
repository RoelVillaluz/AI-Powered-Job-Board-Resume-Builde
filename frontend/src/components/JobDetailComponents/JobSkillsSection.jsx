import { useMemo } from "react";
import { useResumeStore } from "../../stores/resumeStore";
import { useJobDetails } from "../../hooks/jobs/useJobDetails";
import { useToggleSkill } from "../../hooks/resumes/useResumeMutations";
import { useAuthStore } from "../../stores/authStore";

function JobSkillsSection({ jobId }) {
    const user = useAuthStore((state) => state.user);

    // Get currentResume only if the user is a jobseeker
    const currentResume = user.role === 'jobseeker' ? useResumeStore(state => state.currentResume) : null;

    const { job, isLoading, error } = useJobDetails(jobId);

    const toggleSkillMutation = useToggleSkill();

    // Ensure checkedSkills is only calculated if currentResume is available
    const checkedSkills = useMemo(() => 
        currentResume ? new Set(currentResume.skills.map(s => s.name)) : new Set(),
        [currentResume]
    );

    return (
        <section id="skills">
            <div>
                <h3>Skills</h3>
                {!isLoading ? (
                    <ul>
                        {job.skills.map((skill) => (
                            <li key={skill._id}>
                                {user.role === 'jobseeker' && (
                                    <div className="checkbox-wrapper-19">
                                        <input 
                                            type="checkbox" 
                                            id={`cbtest-19-${skill.name}`} 
                                            checked={checkedSkills.has(skill.name)} // 0(1) lookup
                                            onChange={() => {
                                                if (!currentResume) return;
                                                toggleSkillMutation.mutate({ resume: currentResume, skill });
                                            }}
                                        />
                                        <label htmlFor={`cbtest-19-${skill.name}`} className="check-box" />
                                    </div>
                                )}
                                <label htmlFor={`${skill.name}-checkbox`}>{skill.name} {skill.level}</label>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className="skeleton-text-group">
                        <div className="skeleton text long"></div>
                        <div className="skeleton text long"></div>
                        <div className="skeleton text long"></div>
                    </div>
                )}
            </div>
        </section>
    );
}

export default JobSkillsSection;