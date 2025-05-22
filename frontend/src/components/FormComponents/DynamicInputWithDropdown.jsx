function DynamicInputWithDropdown({ config, name, inputs, handleInputChange, handleAddItem = null, setInputs, setFormData, isVisible, toggleVisibility, getFilteredOptions }) {
    return (
        <div className="form-group" key={name}>
            <label>{config.label}</label>
            
            <div className="row" style={{ alignItems: 'start' }}>

                {config?.inputType === "textarea" ? (
                    <textarea
                        value={inputs[name] || ""}
                        onChange={(e) => handleInputChange(e, name)}
                        {...(handleAddItem && { onKeyDown: (e) => handleAddItem(e, name) })}
                        readOnly={config.readOnly}
                    />
                    ) : (
                    <input
                        type={config?.inputType || "text"}
                        value={inputs[name] || ""}
                        onChange={(e) => handleInputChange(e, name)}
                        {...(handleAddItem && { onKeyDown: (e) => handleAddItem(e, name) })}
                        readOnly={config.readOnly}
                    />
                )}

                {config.hasDropDown && (
                    <ul className="select-menu">
                        <button onClick={() => toggleVisibility(config.dropDownName)} className="toggle-dropdown-btn" type="button">
                            {inputs[config.dropDownField] || config.options[0]}
                            <i className="fa-solid fa-angle-down"></i>
                        </button>
                        <ul className={`dropdown-list ${isVisible[config.dropDownName] ? 'visible' : ''}`}>
                            {getFilteredOptions(config.options, inputs[config.dropDownField]).map((option, index) => (
                                <li 
                                    key={index}
                                    onClick={() => { 
                                        setInputs(prev => ({ ...prev, [config.dropDownField]: option }))
                                        toggleVisibility(config.dropDownName)
                                        // Directly update parent formData if updateFormOnClick is true
                                        if (config.updateFormOnClick) {
                                            setFormData(prev => ({
                                                ...prev,
                                                [config.dropDownField]: option
                                            }))
                                        }
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
    )
}

export default DynamicInputWithDropdown