
import { useMemo } from "react";
import { useResumeActions } from "../../hooks/resumes/useResumeActions";
import { useAuth } from "../../contexts/AuthProvider";
import { useResume } from "../../contexts/ResumesContext";
import { useData } from "../../contexts/DataProvider";

function JobSkillsSection({ job, loading = false }) {
    const { user, setUser } = useAuth();
    const { currentResume, setCurrentResume } = useResume();
    const { handleAddSkillToResume } = useResumeActions(baseUrl, user, setUser, setCurrentResume);

    // Calculate once per render instead of per-checkbox
    const checkedSkills = useMemo(() => 
        new Set(currentResume?.skills.map(s => s.name) || []),
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
                                        id={`cbtest-19-${skill.name}`} 
                                        checked={checkedSkills.has(skill.name)} // 0(1) lookup
                                        onChange={() => handleAddSkillToResume(currentResume?.name, skill)}
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