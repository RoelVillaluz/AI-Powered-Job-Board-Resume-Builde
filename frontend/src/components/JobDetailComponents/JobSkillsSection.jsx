
import { useMemo } from "react";
import { useResumeActions } from "../../hooks/resumes/useResumeActions";

function JobSkillsSection({ baseUrl, user, setUser, job, loading = false, currentResume, setCurrentResume }) {
    const { handleAddSkillToResume } = useResumeActions(baseUrl, user, setUser, setCurrentResume);

    // Calculate once per render instead of per-checkbox
    const checkedSkills = useMemo(() => 
        new Set(currentResume?.skills.map(s => s._id) || []),
        [currentResume?.skills]
    )

    return (
        <section id="skills">
                                
            <div>
                <h3>Skills</h3>
                {!loading ? (
                    <ul>
                        {job.skills.map((skill) => (
                            <li key={skill._id}>
                                <div className="checkbox-wrapper-19">
                                    <input 
                                        type="checkbox" 
                                        id={`cbtest-19 ${skill.name}`} 
                                        checked={checkedSkills.has(skill._id)} // 0(1) lookup
                                        onChange={() => handleAddSkillToResume(currentResume?._id, skill)}
                                    />
                                    <label htmlFor={`cbtest-19 ${skill.name}`} className="check-box" />
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