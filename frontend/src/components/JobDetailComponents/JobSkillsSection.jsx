
import { useMemo } from "react";
import { useResumeStore } from "../../stores/resumeStore";
import { useJobDetails } from "../../hooks/jobs/useJobDetails"
import { useToggleSkill } from "../../hooks/resumes/useResumeMutations";

function JobSkillsSection({ jobId }) {
    const currentResume = useResumeStore(state => state.currentResume);
    const { job, isLoading, error } = useJobDetails(jobId);

    const toggleSkillMutation = useToggleSkill();

    // Calculate once per render instead of per-checkbox
    const checkedSkills = useMemo(() => 
        new Set(currentResume?.skills.map(s => s.name) || []),
        [currentResume?.skills]
    )

    return (
        <section id="skills">
                                
            <div>
                <h3>Skills</h3>
                {!isLoading ? (
                    <ul>
                        {job.skills.map((skill) => (
                            <li key={skill._id}>
                                <div className="checkbox-wrapper-19">
                                    <input 
                                        type="checkbox" 
                                        id={`cbtest-19-${skill.name}`} 
                                        checked={checkedSkills.has(skill.name)} // 0(1) lookup
                                        onChange={() => {
                                            if (!currentResume) return;
                                            toggleSkillMutation.mutate({ resume: currentResume, skill })
                                        }}
                                    />
                                    <label htmlFor={`cbtest-19-${skill.name}`} className="check-box" />
                                </div>
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
    )
}

export default JobSkillsSection