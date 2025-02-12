import { useState } from "react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";

function SkillsSection({ selectedRole, setFormData, formData, handleChange, handleDrag, handleRemove  }) {
    const [skillInput, setSkillInput] = useState('');
    const [levelInput, setLevelInput] = useState('Beginner'); 

    const skillLevels = ["Level", "Beginner", "Intermediate", "Advanced"];

    const handleAddSkill = (e) => {
        if (e.key === 'Enter' && skillInput.trim()) {
            e.preventDefault();

            // Ensure we're not adding empty skills
            if (skillInput.trim()) {
                handleChange({
                    target: { 
                        name: "skills", 
                        value: [...formData.skills, { name: skillInput.trim(), level: levelInput }] 
                    }
                });

                setSkillInput('');
                setLevelInput('Level'); // Reset level selection
            }
        }
    };

    const handleDragEnd = (result) => {
        if (!result.destination) return;

        const reorderedSkills = [...formData.skills];
        const [movedSkill] = reorderedSkills.splice(result.source.index, 1);
        reorderedSkills.splice(result.destination.index, 0, movedSkill);

        handleChange({
            target: { name: "skills", value: reorderedSkills }
        });
    };

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
                    <div className="wrapper" style={{ alignItems: 'stretch' }}>
                        <input 
                            type="text" 
                            value={skillInput}
                            onChange={(e) => setSkillInput(e.target.value)} 
                            onKeyDown={handleAddSkill}
                        />
                        <select className="skill-select" value={levelInput} onChange={(e) => setLevelInput(e.target.value)}>
                            {skillLevels.map((level) => (
                                <option key={level} value={level === "Level" ? "" : level}>
                                    {level}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
                <DragDropContext onDragEnd={(result) => handleDrag("skills", result, setFormData)}>
                    <Droppable droppableId="skills-list">
                        {(provided) => (
                            <ul className="added-skills" 
                                {...provided.droppableProps}
                                ref={provided.innerRef}
                            >   
                                {formData.skills.length > 0 && formData.skills.some(skill => skill.name.trim()) ? (
                                    formData.skills.map((skill, index) => (
                                        <Draggable key={skill.name} draggableId={skill.name} index={index}>
                                            {(provided) => (
                                                <li 
                                                    ref={provided.innerRef}
                                                    {...provided.draggableProps}
                                                    {...provided.dragHandleProps}
                                                    className="draggable-skill"
                                                >
                                                    <span>{skill.name} {skill.level === 'Level' ? '' : ` - ${skill.level}`}</span>
                                                    <i class="fa-solid fa-xmark" onClick={() => handleRemove("skills", index)}></i>
                                                </li>
                                            )}
                                        </Draggable>
                                    ))
                                ) : (
                                    <p>No skills added yet.</p>
                                )}
                                {provided.placeholder}
                            </ul>
                        )}
                    </Droppable>
                </DragDropContext>
            </div>
        </section>
    );
}

export default SkillsSection;
