import type { CreateJobFormData, FormSkill } from "../types/forms/createJobForm.types";

export const STATUS_OPTIONS = [
  { value: 'Active', label: 'Active' },
  { value: 'Archived', label: 'Archived' },
] as const satisfies { value: CreateJobFormData['status']; label: string }[];

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

export const EXPERIENCE_LEVEL_OPTIONS = [
    { value: "Intern", label: "Intern" },
    { value: "Entry",  label: "Entry"  },
    { value: "Mid-Level",   label: "Mid-Level" },
    { value: "Senior",  label: "Senior" },
] as const satisfies { value: CreateJobFormData["experienceLevel"]; label: string }[];

export const JOB_TYPE_OPTIONS = [
  { value: "Full-Time",  label: "Full-Time"  },
  { value: "Part-Time",  label: "Part-Time"  },
  { value: "Contract",   label: "Contract"   },
  { value: "Internship", label: "Internship" },
] as const satisfies { value: CreateJobFormData["jobType"]; label: string }[];

export const EDUCATION_LEVEL_OPTIONS = [
  { value: '', label: 'Select education level' },
  { value: 'High School', label: 'High School' },
  { value: 'Associate', label: 'Associate' },
  { value: 'Bachelor', label: 'Bachelor' },
  { value: 'Master', label: 'Master' },
  { value: 'PhD', label: 'PhD' },
  { value: 'None Required', label: 'None Required' },
] as const satisfies {
  value: CreateJobFormData['requirements']['education'] | '';
  label: string;
}[];

export const REQUIREMENT_LEVEL_OPTIONS = [
  { value: "Required",     label: "Required"     },
  { value: "Preferred",    label: "Preferred"    },
  { value: "Nice-to-Have", label: "Nice-to-Have" },
] as const satisfies { value: NonNullable<FormSkill["requirementLevel"]>; label: string }[];