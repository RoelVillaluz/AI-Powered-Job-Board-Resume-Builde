
import { useResumeActions } from "../../hooks/resumes/useResumeActions";

function JobSkillsSection({ baseUrl, user, setUser, job, loading = false, currentResume, setCurrentResume }) {
    const { handleAddSkillToResume } = useResumeActions(baseUrl, user, setUser, setCurrentResume);

    return (
        <section id="skills">
                                
            <div>
                <h3>Skills</h3>
                {!loading ? (
                    <ul>
                        {job.skills.map((skill, index) => (
                            <li key={index}>
                                <div className="checkbox-wrapper-19">
                                    <input 
                                        type="checkbox" 
                                        id={`cbtest-19 ${skill.name}`} 
                                        checked={currentResume?.skills.some(s => s.name === skill.name)}
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