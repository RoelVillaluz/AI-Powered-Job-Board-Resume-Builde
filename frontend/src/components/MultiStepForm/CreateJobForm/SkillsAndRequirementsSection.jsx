import { useState } from "react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";

function SkillsAndRequirementsSection({ formData, setFormData, handleChange }) {
    const formTypes = {
        skills: {
            label: "Skills",
            hasDropDown: true,
            dropDownName: "skillDropdown",
            dropDownField: "level",
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
                
                {Object.entries(formTypes).map(([name, config]) => (
                    <>
                        <div className="form-group" key={name}>
                            <label>{config.label}</label>
                            
                            <div className="row" style={{ alignItems: 'start' }}>

                                <input 
                                    type="text" 
                                    value={inputs[name] || ""}
                                    onChange={(e) => handleInputChange(e, name)}
                                    onKeyDown={(e) => handleAddItem(e, name)}
                                />

                                {config.hasDropDown && (
                                    <ul className="select-menu">
                                        <button onClick={() => toggleVisibility(config.dropDownName)} className="toggle-dropdown-btn" type="button">
                                            {inputs[config.dropDownField] || config.options[0]}
                                            <i className="fa-solid fa-angle-down"></i>
                                        </button>
                                        <ul className={`dropdown-list ${isVisible[formTypes[name].dropDownName] ? 'visible' : ''}`}>
                                            {getFilteredOptions(config.options, inputs[config.dropDownField]).map((option, index) => (
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
                                )}

                            </div>

                        </div>

                        {/* <DragDropContext onDragEnd={handleDragEnd}>
                            <Droppable droppableId="">

                            </Droppable>
                        </DragDropContext> */}
                    </>
                ))}

            </div>

        </section>
    )
}

export default SkillsAndRequirementsSection