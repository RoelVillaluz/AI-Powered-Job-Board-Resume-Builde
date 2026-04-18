import { useCallback } from "react";
import { useJobForm } from "../../contexts/JobFormContexts/JobPostingFormContext";
import { useStepNavigation } from "./useStepNavigation";
import type { CreateJobFormData } from "../../../types/forms/createJobForm.types";

type FormErrors = Record<string, string>;

// ─── Per-step validator functions ─────────────────────────────────────────────
// Pure functions: take formData, return every possible error for that step.
// They are always fully evaluated — touched state filters them in the hook,
// not here. That separation means these are easy to unit test in isolation.

const validateJobDetailsSection = (formData: CreateJobFormData): FormErrors => {
  const errors: FormErrors = {};
  const min = Number(formData.salary?.min);
  const max = Number(formData.salary?.max);

  if (!formData.title?.name.trim()) {
    errors.title = "Job title is required.";
  }
  if (!formData.location?.name.trim()) {
    errors.location = "Location is required.";
  }
  if (!formData.description.trim()) {
    errors.description = "Description is required.";
  }
  if (!formData.jobType?.toString().trim()) {
    errors.jobType = "Job type is required.";
  }
  if (formData.salary?.min === null || formData.salary?.min === undefined || isNaN(min)) {
    errors["salary.min"] = "Minimum salary is required.";
  }
  if (formData.salary?.max === null || formData.salary?.max === undefined || isNaN(max)) {
    errors["salary.max"] = "Maximum salary is required.";
  }
  // Cross-field: only relevant when both individual values are present
  if (!errors["salary.min"] && !errors["salary.max"] && min >= max) {
    errors["salary.range"] = "Minimum must be less than maximum.";
  }

  return errors;
};

const validateSkills = (formData: CreateJobFormData): FormErrors => {
  const errors: FormErrors = {};

  if (formData.skills.length < 3) {
    errors.skills = "Add at least 3 skills.";
  }

  return errors;
};

const validateRequirements = (formData: CreateJobFormData): FormErrors => {
  const errors: FormErrors = {};

  const hasDescription = formData.requirements.description.trim().length >= 10;

  if (!hasDescription) {
    errors.requirements = "Must have at least a requirements description"
  }

  return errors;
};

// ─── Step validator registry ──────────────────────────────────────────────────
// To add validation for a new step: write a validator function above and
// add one entry here. No changes needed anywhere else in this hook.

const STEP_VALIDATORS: Record<string, (data: CreateJobFormData) => FormErrors> = {
  details: validateJobDetailsSection,
  skills: validateSkills,
  requirements: validateRequirements,
};

// ─────────────────────────────────────────────────────────────────────────────

/**
 * useFormValidation
 * ------------------
 * Step-aware validation for the Create Job form. Automatically runs the
 * correct validator for the active step and gates error visibility behind
 * the `touched` set from `JobFormContext`.
 *
 * ### What "touched" means
 * Every field starts untouched — no errors are shown on a fresh form.
 * A field becomes touched in one of two ways:
 * - The user blurs it → the field calls `touch("fieldName")`
 * - The user clicks Next while the step is invalid → `touchAll()` marks
 *   every currently-failing field at once so nothing stays silently hidden
 *
 * ### Returned values
 * - `errors`   — errors for touched fields only; pass to field components
 * - `allErrors`— unfiltered errors; used by `useStepNavigation` to determine
 *                `isValid` without caring about what the user has seen
 * - `touch`    — mark one field as touched (call in `onBlur`)
 * - `touchAll` — mark all failing fields touched (call before blocking Next)
 * - `isValid`  — true when the current step has zero errors
 *
 * ### Adding a new step
 * 1. Write a `validateX(data): FormErrors` function above
 * 2. Add it to `STEP_VALIDATORS` — no other changes needed
 */
export const useFormValidation = (stepKey: string) => {
  const { formData, touched, setTouched } = useJobForm();
  const validator = STEP_VALIDATORS[stepKey] ?? (() => ({}));
  const allErrors = validator(formData);

  const errors: FormErrors = Object.fromEntries(
    Object.entries(allErrors).filter(([key]) => touched.has(key))
  );

  const touch = useCallback(
    (field: string) => setTouched((prev) => new Set(prev).add(field)),
    [setTouched]
  );

  const touchAll = useCallback(
    () => setTouched(new Set(Object.keys(allErrors))),
    [allErrors, setTouched]
  );

  const isValid = Object.keys(allErrors).length === 0;

  return { errors, allErrors, touch, touchAll, isValid };
};