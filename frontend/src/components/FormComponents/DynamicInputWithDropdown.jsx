function DynamicInputWithDropdown({ config, name, inputs, handleInputChange, handleAddItem, setInputs, isVisible, toggleVisibility, getFilteredOptions }) {
    return (
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
                        <ul className={`dropdown-list ${isVisible[config.dropDownName] ? 'visible' : ''}`}>
                            {getFilteredOptions(config.options, inputs[config.dropDownField]).map((option, index) => (
                                <li 
                                    key={index}
                                    onClick={() => { 
                                        setInputs(prev => ({ ...prev, level: option }))
                                        toggleVisibility(config.dropDownName)
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