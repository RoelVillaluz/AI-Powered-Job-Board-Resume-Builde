import { useState } from "react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";

function SkillsAndRequirementsSection({ formData, setFormData, handleChange }) {
    const formTypes = {
        skills: {
            label: "Skills",
            hasDropDown: true,
            dropDownName: "skillDropdown",
            options: ["Level", "Beginner", "Intermediate", "Advanced"],
        },
        requirements : {
            label: "Requirements",
            hasDropdDown: false,
        }
    }

    const [inputs, setInputs] = useState({
        skills: '',
        level: 'Level',
        requirements: ''
    })

    const [isVisible, setIsVisible] = useState({
        skillDropdown: false
    })

    const options = {
        skillLevelOptions: ["Level", "Beginner", "Intermediate", "Advanced"],
    }

    const handleInputChange = (e, name) => {
        setInputs(prev => ({ ...prev, [name]: e.target.value }))
    }

    const handleAddItem = (e, name) => {
        if (e.key === 'Enter' && inputs[name].trim()) {
            e.preventDefault();

            const currentList = formData[name] || [];

            const newItem = name === "skills"
                ? { name: inputs[name].trim(), level: inputs.level || "Level" }
                : inputs[name].trim();

            handleChange({
                target: {
                    name: name,
                    value: [...currentList, newItem]
                }
            });

            setInputs(prev => ({ ...prev, [name]: "" }))
        }
    }

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
                <h3>What skills and requirements are you looking for?</h3>
            </header>
            
            <div className="form-details">

                <div className="form-group">

                    {/* Skill Name Input */}
                    <label htmlFor="skills">Skills</label>

                    <div className="row" style={{ alignItems: 'start' }}>

                        <input 
                            type="text" 
                            value={inputs.skill}
                            onChange={(e) => handleInputChange(e, "skills")}
                            onKeyDown={(e) => handleAddItem(e, "skills")}
                        />

                        <ul className="select-menu">

                            <button onClick={() => toggleVisibility("skillDropdown")} className="toggle-dropdown-btn" type="button">
                                {inputs.level || options.skillLevelOptions[0]}
                                <i className="fa-solid fa-angle-down"></i>
                            </button>

                            <ul className={`dropdown-list ${isVisible.skillDropdown ? 'visible' : ''}`}>
                                {getFilteredOptions(options.skillLevelOptions, inputs.level).map((option, index) => (
                                    <li 
                                        key={index}
                                        onClick={() => { 
                                            setInputs(prev => ({ ...prev, level: option }))
                                            toggleVisibility("skillDropdown")
                                        }}
                                    >
                                    <span className="option-text">{option}</span>
                                    </li>
                                ))}
                            </ul>

                        </ul>

                    </div>

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

                <div className="form-group">

                    {/* Requirements Input */}
                    <label htmlFor="requirements">Requirements</label>

                    <div className="row" style={{ alignItems: 'start' }}>

                        <input 
                            type="text" 
                            value={inputs.requirement}
                            onChange={(e) => handleInputChange(e, "requirements")}
                            onKeyDown={(e) => handleAddItem(e, "requirements")}
                        />

                    </div>

                </div>

            </div>
        </section>
    )
}

export default SkillsAndRequirementsSection