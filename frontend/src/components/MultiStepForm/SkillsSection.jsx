import axios from "axios";
import { useEffect, useState } from "react";
import { useData } from "../../DataProvider";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";

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

    const handleDragEnd = (result) => {
        if (!result.destination) return

        const reorderedSkills = [...formData.skills]
        const [movedSkill] = reorderedSkills.splice(result.source.index, 1)
        reorderedSkills.splice(result.destination.index, 0, movedSkill)

        handleChange({
            target: { name: "skills", value: reorderedSkills }
        });
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
                <DragDropContext onDragEnd={handleDragEnd}>
                    <Droppable droppableId="skills-list">
                        {(provided) => (
                            <ul className="added-skills" 
                                {...provided.droppableProps}
                                ref={provided.innerRef}
                            >   
                                {formData.skills.map((skill, index) => (
                                    <Draggable key={skill} draggableId={skill} index={index}>
                                        {(provided) => (
                                            <li 
                                                ref={provided.innerRef}
                                                {...provided.draggableProps}
                                                {...provided.dragHandleProps}
                                                className="draggable-skill"
                                            >
                                                {skill}
                                            </li>
                                        )}
                                    </Draggable>
                                ))}
                            </ul>
                        )}
                    </Droppable>
                </DragDropContext>
            </div>
        </section>
    );
}

export default SkillsSection;
