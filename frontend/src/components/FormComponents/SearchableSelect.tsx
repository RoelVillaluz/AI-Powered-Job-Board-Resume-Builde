import { useState, useEffect, useRef, useCallback } from "react";
import type { SelectOption } from "../../hooks/createJobForm/useCreateJobFormData";

interface SearchableSelectProps {
  label: string;
  name: string;
  value: string;
  options?: SelectOption[];
  onChange: (value: string) => void;
  onSelect?: (option: SelectOption) => void;
  isLoading?: boolean;
  placeholder: string;
}

/**
 * SearchableSelect
 * -----------------
 * Accessible controlled combobox for searching and selecting relational model
 * data (job title, location, skills, etc.).
 *
 * ## Behaviour
 * - Typing calls `onChange`; the parent is responsible for debouncing and
 *   fetching options. This component only filters the options it receives.
 * - Confirming a selection calls both `onChange` (with the name string) and
 *   `onSelect` (with the full `{_id, name}` object).
 * - The dropdown closes on selection, Escape, or a click outside the component.
 *
 * ## Keyboard support
 * | Key        | Action                                      |
 * |------------|---------------------------------------------|
 * | ArrowDown  | Move highlight down (wraps to top)          |
 * | ArrowUp    | Move highlight up (wraps to bottom)         |
 * | Enter      | Confirm highlighted option                  |
 * | Escape     | Close dropdown, clear highlight             |
 *
 * ## Accessibility
 * - `role="combobox"` on the input with `aria-expanded`, `aria-controls`,
 *   and `aria-activedescendant` wired to the active option.
 * - `role="listbox"` on the dropdown; each option has `role="option"` and
 *   `aria-selected`.
 * - `<label>` is associated to the input via matching `htmlFor` / `id`.
 *
 * @example
 * <SearchableSelect
 *   label="Job Title"
 *   name="title"
 *   value={search}
 *   options={options}
 *   onChange={setSearch}
 *   onSelect={(opt) => handleSelect("title", opt)}
 *   isLoading={isLoading}
 *   placeholder="Search job titles..."
 * />
 */
export function SearchableSelect({
  label,
  name,
  value,
  options = [],
  onChange,
  onSelect,
  isLoading,
  placeholder,
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  // Stable IDs for ARIA wiring
  const inputId = `${name}-input`;
  const listboxId = `${name}-listbox`;
  const getOptionId = (index: number) => `${listboxId}-option-${index}`;

  const filteredOptions = options.filter((opt) =>
    opt.name.toLowerCase().includes(value.toLowerCase())
  );

  const hasContent = isLoading || filteredOptions.length > 0 || value.length > 0;

  // ─── Open / close ────────────────────────────────────────────────────────────

  const closeDropdown = useCallback(() => {
    setIsOpen(false);
    setActiveIndex(-1);
  }, []);

  // rAF ensures the element is mounted before the CSS transition class is added
  useEffect(() => {
    if (hasContent) {
      const raf = requestAnimationFrame(() => setIsOpen(true));
      return () => cancelAnimationFrame(raf);
    }
    closeDropdown();
  }, [hasContent, closeDropdown]);

  // Close when the user clicks outside the component
  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        closeDropdown();
      }
    };
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [closeDropdown]);

  // ─── Selection ───────────────────────────────────────────────────────────────

  const handleSelectOption = useCallback(
    (opt: SelectOption) => {
      onChange(opt.name);
      onSelect?.(opt);
      closeDropdown();
    },
    [onChange, onSelect, closeDropdown]
  );

  // ─── Keyboard navigation ─────────────────────────────────────────────────────

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((prev) =>
          prev < filteredOptions.length - 1 ? prev + 1 : 0
        );
        break;

      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((prev) =>
          prev > 0 ? prev - 1 : filteredOptions.length - 1
        );
        break; // ← was missing, causing fall-through to Enter

      case "Enter":
        e.preventDefault();
        if (activeIndex >= 0 && filteredOptions[activeIndex]) {
          handleSelectOption(filteredOptions[activeIndex]);
        }
        break;

      case "Escape":
        e.preventDefault();
        closeDropdown();
        break;
    }
  };

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="searchable-select" ref={containerRef}>
      <label htmlFor={inputId}>{label}</label>

      <input
        id={inputId}
        type="text"
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        autoComplete="off"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        aria-activedescendant={
          activeIndex >= 0 ? getOptionId(activeIndex) : undefined
        }
      />

      {hasContent && (
        <ul
          id={listboxId}
          role="listbox"
          aria-label={label}
          className={`dropdown ${isOpen ? "show" : ""} ${isLoading ? "loading" : ""}`}
        >
          {isLoading ? (
            [...Array(5)].map((_, i) => (
              <li key={i} aria-hidden="true">
                <div
                  className="shimmer-bar"
                  style={{ width: `${55 + (i % 3) * 15}%` }}
                />
              </li>
            ))
          ) : filteredOptions.length > 0 ? (
            filteredOptions.map((opt, index) => (
              <li
                key={opt._id ?? opt.name}
                id={getOptionId(index)}
                role="option"
                aria-selected={index === activeIndex}
                className={index === activeIndex ? "active" : ""}
                // onMouseDown fires before the input's blur event, so the
                // outside-click handler doesn't swallow the selection first
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelectOption(opt);
                }}
              >
                {opt.name}
              </li>
            ))
          ) : (
            <li className="no-results" role="option" aria-selected={false}>
              No items found for &ldquo;{value}&rdquo;
            </li>
          )}
        </ul>
      )}
    </div>
  );
}