import type { CreateJobFormData } from "../../../../../types/forms/createJobForm.types";
import { useJobForm } from "../../../../contexts/JobFormContexts/JobPostingFormContext";
import { DropdownField } from "../../../FormComponents/DropdownField";

// ─── Option constants ─────────────────────────────────────────────────────────

export const CURRENCY_OPTIONS = [
  { value: "$",  label: "$ USD" },
  { value: "₱",  label: "₱ PHP" },
  { value: "€",  label: "€ EUR" },
  { value: "¥",  label: "¥ JPY" },
  { value: "£",  label: "£ GBP" },
] as const satisfies { value: CreateJobFormData["salary"]["currency"]; label: string }[];

export const FREQUENCY_OPTIONS = [
  { value: "hour",  label: "per hour"  },
  { value: "day",   label: "per day"   },
  { value: "week",  label: "per week"  },
  { value: "month", label: "per month" },
  { value: "year",  label: "per year"  },
] as const satisfies { value: CreateJobFormData["salary"]["frequency"]; label: string }[];

/**
 * SalaryInputField
 * -----------------
 * Compound salary row: [currency] [min] — [max] [frequency].
 *
 * Currency and frequency use `DropdownField` (fixed option sets) which
 * synthesizes a `React.ChangeEvent<HTMLSelectElement>` so they can share
 * the same `handleChange` from `useCreateJobFormData` as the number inputs.
 *
 * All four fields write to `formData.salary.*` via dot-notation `name`
 * attributes, resolved by the `setDeep` utility in the form hook.
 *
 * @param formData  - Current form state from useCreateJobFormData
 * @param onChange  - handleChange from useCreateJobFormData
 */
export const SalaryInputField = () => {
  const { formData, handleChange } = useJobForm();

  return (
    <div className="form-group">
      <label className="text-sm md:text-base lg:text-xl font-semibold -mb-2">
        Salary
      </label>

      <div className="flex items-center" style={{ gap: "0.5rem" }}>
        <DropdownField
          label="Currency"
          name="salary.currency"
          value={formData.salary.currency}
          options={CURRENCY_OPTIONS}
          onChange={handleChange}
        />

        <input
          type="number"
          name="salary.min"
          value={formData.salary.min ?? ""}
          placeholder="Min"
          onChange={handleChange}
          min={0}
          aria-label="Minimum salary"
        />

        <input
          type="number"
          name="salary.max"
          value={formData.salary.max ?? ""}
          placeholder="Max"
          onChange={handleChange}
          min={0}
          aria-label="Maximum salary"
        />

        <DropdownField
          label="Frequency"
          name="salary.frequency"
          value={formData.salary.frequency}
          options={FREQUENCY_OPTIONS}
          onChange={handleChange}
        />
      </div>
    </div>
  );
};