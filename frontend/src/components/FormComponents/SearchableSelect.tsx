import { useState, useEffect } from "react";

interface SearchableSelectProps {
  label: string;
  name: string;
  value: string;
  options?: string[];
  onChange: (value: string) => void;
  isLoading?: boolean;
  placeholder: string;
}

export function SearchableSelect({
  label,
  name,
  value,
  options = [],
  onChange,
  isLoading,
  placeholder,
}: SearchableSelectProps) {
  const [dropdownVisible, setDropdownVisible] = useState(false);

  const filteredOptions = options.filter((opt) =>
    opt.toLowerCase().includes(value.toLowerCase())
  );

  const showDropdown = isLoading || filteredOptions.length > 0 || value;

  useEffect(() => {
    if (showDropdown) {
      // Wait a tick before adding "show" class for transition
      const timer = setTimeout(() => setDropdownVisible(true), 10);
      return () => clearTimeout(timer);
    } else {
      setDropdownVisible(false);
    }
  }, [showDropdown]);

  return (
    <div className="searchable-select">
      <label>{label}</label>
      <input
        type="text"
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />

      {(isLoading || filteredOptions.length > 0 || value) && (
        <ul className={`dropdown ${dropdownVisible ? "show" : ""} ${isLoading ? "loading" : ""}`}>
          {isLoading
            ? [...Array(5)].map((_, i) => (
                <li key={i}>
                  <div
                    className="shimmer-bar"
                    style={{ width: `${55 + (i % 3) * 15}%` }}
                  />
                </li>
              ))
            : filteredOptions.length > 0
            ? filteredOptions.map((opt) => (
                <li key={opt} onClick={() => onChange(opt)}>
                  {opt}
                </li>
              ))
            : // Show fallback when no matches
              <li className="no-results">No items found for "{value}"</li>
          }
        </ul>
      )}
    </div>
  );
}