type ToggleSliderProps = {
    id: string;
    label: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
    disabled?: boolean;
    style?: React.CSSProperties;
};

export const ToggleSlider = ({ id, label, checked, onChange, disabled = false, style }: ToggleSliderProps) => {
    return (
        <div className="toggle-slider" style={style}>
            <label htmlFor={id} className="toggle-slider__label">
                {label}
            </label>
            <button
                id={id}
                type="button"
                role="switch"
                aria-checked={checked}
                aria-label={label}
                disabled={disabled}
                className={`toggle-slider__track ${checked ? 'toggle-slider__track--on' : ''} ${disabled ? 'toggle-slider__track--disabled' : ''}`}
                onClick={() => onChange(!checked)}
            >
                <span className="toggle-slider__thumb" />
            </button>
        </div>
    );
};