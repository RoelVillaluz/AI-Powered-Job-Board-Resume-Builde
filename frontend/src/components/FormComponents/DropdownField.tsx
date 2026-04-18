import { useState, useEffect, useRef, useCallback } from "react";

interface DropdownFieldProps<T extends string> {
  label: string;
  name: string;
  value?: T;
  options: readonly { value: T; label: string }[];
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  allowUndefined?: boolean;
}

/**
 * DropdownField
 * -------------
 * A compact, accessible custom dropdown for fixed option sets (currency,
 * frequency, etc.). Shares the same cascading-list animation as SearchableSelect
 * via the shared `.dropdown` CSS class.
 *
 * ## Behaviour
 * - The trigger button always shows the selected option's label (acts as placeholder).
 * - Clicking the trigger or pressing Space/Enter opens the list.
 * - The list closes on selection, Escape, or an outside click.
 * - On selection, synthesizes a `React.ChangeEvent<HTMLSelectElement>` so it is
 *   compatible with `useCreateJobFormData.handleChange` without a separate handler.
 *
 * ## Keyboard support
 * | Key           | Action                              |
 * |---------------|-------------------------------------|
 * | Space / Enter | Open list; confirm highlighted item |
 * | ArrowDown     | Move highlight down (wraps)         |
 * | ArrowUp       | Move highlight up (wraps)           |
 * | Escape        | Close list, return focus to trigger |
 *
 * ## Accessibility
 * - `role="combobox"` on the trigger with `aria-haspopup="listbox"`,
 *   `aria-expanded`, and `aria-controls` pointing at the listbox.
 * - `role="listbox"` on the list; each item has `role="option"`,
 *   `aria-selected`, and a stable `id` for `aria-activedescendant`.
 * - `<label>` text is surfaced via `aria-label` on the trigger.
 *
 * @example
 * <DropdownField
 *   label="Currency"
 *   name="salary.currency"
 *   value={formData.salary.currency}
 *   options={CURRENCY_OPTIONS}
 *   onChange={handleChange}
 * />
 */
export function DropdownField<T extends string>({
  label,
  name,
  value,
  options,
  onChange,
  allowUndefined = false,
}: DropdownFieldProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const listboxId = `${name}-listbox`;
  const getOptionId = (index: number) => `${listboxId}-option-${index}`;

  // 👇 Add "Clear" option if allowed
  const finalOptions = allowUndefined
    ? [...options, { value: "__CLEAR__" as T, label: "Clear selection" }]
    : options;

  const selectedLabel =
    options.find((o) => o.value === value)?.label ??
    (allowUndefined ? "Select an option" : value ?? "");

  // ─── Open / close ─────────────────────────────────────────

  const closeDropdown = useCallback(() => {
    setIsOpen(false);
    setActiveIndex(-1);
  }, []);

  const openDropdown = useCallback(() => {
    const currentIndex = finalOptions.findIndex((o) => o.value === value);
    setActiveIndex(currentIndex >= 0 ? currentIndex : 0);
    requestAnimationFrame(() => setIsOpen(true));
  }, [finalOptions, value]);

  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        closeDropdown();
      }
    };
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [closeDropdown]);

  // ─── Selection ────────────────────────────────────────────

  const handleSelectOption = useCallback(
    (option?: { value: T; label: string }) => {
      onChange({
        target: {
          name,
          value: option?.value ?? undefined,
        },
      } as unknown as React.ChangeEvent<HTMLSelectElement>);

      closeDropdown();
      triggerRef.current?.focus();
    },
    [name, onChange, closeDropdown]
  );

  // ─── Keyboard navigation ─────────────────────────────────

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    switch (e.key) {
      case " ":
      case "Enter":
        e.preventDefault();
        if (!isOpen) {
          openDropdown();
        } else if (activeIndex >= 0 && finalOptions[activeIndex]) {
          const opt = finalOptions[activeIndex];
          if (allowUndefined && opt.value === "__CLEAR__") {
            handleSelectOption(undefined);
          } else {
            handleSelectOption(opt);
          }
        }
        break;

      case "ArrowDown":
        e.preventDefault();
        if (!isOpen) {
          openDropdown();
        } else {
          setActiveIndex((prev) =>
            prev < finalOptions.length - 1 ? prev + 1 : 0
          );
        }
        break;

      case "ArrowUp":
        e.preventDefault();
        if (!isOpen) {
          openDropdown();
        } else {
          setActiveIndex((prev) =>
            prev > 0 ? prev - 1 : finalOptions.length - 1
          );
        }
        break;

      case "Escape":
        e.preventDefault();
        closeDropdown();
        break;
    }
  };

  // ─── Render ──────────────────────────────────────────────

  return (
    <div className="searchable-select" ref={containerRef}>
      <button
        ref={triggerRef}
        type="button"
        className="dropdown-trigger"
        onMouseDown={(e) => {
          e.preventDefault();
          isOpen ? closeDropdown() : openDropdown();
          triggerRef.current?.focus();
        }}
        onKeyDown={handleKeyDown}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        aria-label={label}
        aria-activedescendant={
          activeIndex >= 0 ? getOptionId(activeIndex) : undefined
        }
      >
        <span style={{ color: value ? "#000" : "#999" }}>
          {selectedLabel}
        </span>

        <svg
          className={`dropdown-chevron ${isOpen ? "open" : ""}`}
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M2 4l4 4 4-4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {isOpen && (
        <ul
          id={listboxId}
          role="listbox"
          aria-label={label}
          className={`dropdown ${isOpen ? "show" : ""}`}
        >
          {finalOptions.map((opt, index) => {
            const isClear = allowUndefined && opt.value === "__CLEAR__";

            return (
              <li
                key={opt.value}
                id={getOptionId(index)}
                role="option"
                aria-selected={opt.value === value}
                className={[
                  index === activeIndex ? "active" : "",
                  opt.value === value ? "selected" : "",
                  isClear ? "clear-option" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                onMouseDown={(e) => {
                  e.preventDefault();
                  if (isClear) {
                    handleSelectOption(undefined);
                  } else {
                    handleSelectOption(opt);
                  }
                }}
              >
                {opt.label}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}