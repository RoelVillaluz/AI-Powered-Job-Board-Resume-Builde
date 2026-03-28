interface InputFieldProps {
    label: string;
    name: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    type?: string;
    readOnly?: boolean;
}

export function InputField({
    label,
    name,
    value,
    onChange,
    type = "text",
    readOnly = false,
}: InputFieldProps) {
    return (
        <div className="form-group">
            <label className="text-sm md:text-base lg:text-xl font-semibold -mb-2">{label}</label>
            <input
                type={type}
                name={name}
                value={value}
                onChange={onChange}
            />
        </div>
    );
}