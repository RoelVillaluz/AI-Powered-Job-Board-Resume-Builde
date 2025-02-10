import axios from "axios";
import { useEffect, useState } from "react";
import { useData } from "../../DataProvider";

function SkillsSection({ selectedRole, formData, handleChange }) {
    const { baseUrl } = useData();
    const [skillInput, setSkillInput] = useState('');

    const handleAddSkill = (e) => {
        if (e.key === 'Enter' && skillInput.trim()) {
            e.preventDefault();

            handleChange({
                target: { name: "skills", value: [...formData.skills, skillInput.trim()] }
            })
            setSkillInput('');
        }
    }

    return (
        <section className="user-skills">
            <header>
                <h3>
                    {selectedRole === 'jobseeker'
                        ? 'Showcase Your Skills!'
                        : 'What Skills Are You Looking For?'}
                </h3>
                <p>
                    {selectedRole === 'jobseeker'
                        ? 'Highlight your key skills to stand out to potential employers.'
                        : 'Specify the skills required for the roles you’re hiring for.'}
                </p>
            </header>
            <div className="form-details">
                <div className="form-group">
                    <label htmlFor="skills">Skills (Minimum of 3)</label>
                    <input 
                        type="text" 
                        name="skills" 
                        value={skillInput}
                        onChange={(e) => setSkillInput(e.target.value)} 
                        onKeyDown={handleAddSkill}
                    />
                </div>
                <ul className="added-skills">
                    
                </ul>
            </div>
        </section>
    );
}

export default SkillsSection;
