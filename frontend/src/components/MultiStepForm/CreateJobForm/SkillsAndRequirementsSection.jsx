import { useState } from "react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";

function SkillsAndRequirementsSection({ formData, setFormData, handleChange }) {
    const [skillInput, setSkillInput] = useState('');
    const [levelInput, setLevelInput] = useState('Beginner'); 
    const [requirementInput, setRequirementInput] = useState('');

    const [isVisible, setIsVisible] = useState({
        skillDropdown: false
    })
    const options = {
        skillLevelOptions: ["Level", "Beginner", "Intermediate", "Advanced"],
    }

    const handleAddSkill = (e) => {
        if (e.key === 'Enter' && skillInput.trim()) {
            e.preventDefault();

            // Ensure formData.skills exists
            const currentSkills = formData.skills || [];

            handleChange({
                target: { 
                    name: "skills", 
                    value: [...currentSkills, { name: skillInput.trim(), level: levelInput }] 
                }
            });

            setSkillInput('');
            setLevelInput('Level'); // Reset level selection
        }
    };

    const handleDragEnd = (result) => {
        if (!result.destination) return;

        // Ensure formData.skills exists before modifying
        const reorderedSkills = [...(formData.skills || [])];
        const [movedSkill] = reorderedSkills.splice(result.source.index, 1);
        reorderedSkills.splice(result.destination.index, 0, movedSkill);

        handleChange({
            target: { name: "skills", value: reorderedSkills }
        });
    };

    const handleRemoveListItem = (name, index) => {
        setFormData(prev => {
            const updatedList = [...prev[name]]
            updatedList.splice(index, 1)
            return { ...prev, [name]: updatedList }
        })
    }

    const getFilteredOptions = (options, selectedValue, key = null) => {
        return options.filter((option, index) => {
            if (!selectedValue && index === 0) return false;
            
            if (key) {
                return option[key] !== selectedValue;
            }
            return option !== selectedValue;
        });
    };

    const toggleVisibility = (dropdown) => {
        setIsVisible((prevState) => {
            const updatedState = {}
            Object.keys(prevState).forEach((key) => {
                updatedState[key] = key === dropdown ? !prevState[key] : false;
            })
            return updatedState
        })
    }

    return (
        <section className="user-skills">
            <header>
                <h3>What Skills Are You Looking For?</h3>
            </header>
            
            <div className="form-details">

                <div className="form-group">

                    <label htmlFor="skills">Skills</label>
                    <div className="row" style={{ alignItems: 'start' }}>

                        <input 
                            type="text" 
                            value={skillInput}
                            onChange={(e) => setSkillInput(e.target.value)}
                            onKeyDown={handleAddSkill}
                        />

                        <ul className="select-menu">

                            <button onClick={() => toggleVisibility("skillDropdown")} className="toggle-dropdown-btn" type="button">
                                {formData.skills.level || options.skillLevelOptions[0]}
                                <i className="fa-solid fa-angle-down"></i>
                            </button>

                            <ul className={`dropdown-list ${isVisible.skillDropdown ? 'visible' : ''}`}>
                                {getFilteredOptions(options.skillLevelOptions, formData.skills.level).map((option, index) => (
                                    <li key={index} onClick={() => { 
                                            handleChange({ target: { name: "skills.level", value: option } }) 
                                            toggleVisibility("skillDropdown")
                                        }}>
                                        <span className="option-text">{option}</span>
                                    </li>
                                ))}
                            </ul>

                        </ul>

                    </div>
                    {/* <div className="wrapper" style={{ alignItems: 'stretch' }}>
                        <input 
                            type="text" 
                            value={skillInput}
                            onChange={(e) => setSkillInput(e.target.value)} 
                            onKeyDown={handleAddSkill}
                        />
                        <select className="skill-select" value={levelInput} onChange={(e) => setLevelInput(e.target.value)}>
                            {options.skillOptions.map((level) => (
                                <option key={level} value={level === "Level" ? "" : level}>
                                    {level}
                                </option>
                            ))}
                        </select>
                    </div> */}

                </div>

                <DragDropContext onDragEnd={handleDragEnd}>
                    <Droppable droppableId="skills-list">
                        {(provided) => (
                            <ul className="added-skills" 
                                {...provided.droppableProps}
                                ref={provided.innerRef}
                            >   
                                {formData.skills?.length > 0 ? (
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
                                                    <i className="fa-solid fa-xmark" onClick={() => handleRemoveListItem("skills", index)}></i>
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
    )
}

export default SkillsAndRequirementsSection