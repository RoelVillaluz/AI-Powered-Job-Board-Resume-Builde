import { useState } from "react";
import React from 'react';

import DynamicInputWithDropdown from "../../FormComponents/DynamicInputWithDropdown";
import DraggableList from "../../DraggableList";

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
            inputType: "textarea"
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

    const handleDragEnd = (result, listKey) => {
        if (!result.destination) return;

        const items = Array.from(formData[listKey]);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);

        setFormData(prev => ({
            ...prev,
            [listKey]: items
        }));
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
        <section className="skills-and-requirements">
            <header>
                <h3>What skills and requirements are you looking for?</h3>
            </header>
            
            <div className="form-details">
                
                {Object.entries(formTypes).map(([name, config]) => (
                    <React.Fragment key={name}>

                        <DynamicInputWithDropdown
                            key={name}
                            config={config}
                            name={name}
                            inputs={inputs}
                            handleInputChange={handleInputChange}
                            handleAddItem={handleAddItem}
                            setInputs={setInputs}
                            isVisible={isVisible}
                            toggleVisibility={toggleVisibility}
                            getFilteredOptions={getFilteredOptions}
                        />
                        
                        <DraggableList
                            key={`${name}-list`}
                            listKey={name}
                            items={formData[name]}
                            handleDragEnd={handleDragEnd}
                            handleRemoveListItem={handleRemoveListItem}
                        />

                    </React.Fragment>
                ))}

            </div>

        </section>
    )
}

export default SkillsAndRequirementsSection