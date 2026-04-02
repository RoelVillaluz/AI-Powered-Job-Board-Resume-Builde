import type { StepKey } from "../../../../../constants/steps";
import type { CreateJobFormData } from "../../../../../types/forms/createJobForm.types";

type SummaryFieldConfig = {
  label: string;
  getValue: (data: CreateJobFormData) => string;
  step: StepKey;
};

export const CREATE_JOB_SUMMARY_FIELDS: Record<
  "left" | "right",
  SummaryFieldConfig[]
> = {
  left: [
    {
      label: "Job Title",
      getValue: (d) => d.title.name || "-",
      step: "details",
    },
    {
      label: "Job Type",
      getValue: (d) => d.jobType || "-",
      step: "details",
    },
    {
      label: "Salary",
      getValue: (d) => {
        const { currency, min, max, frequency } = d.salary;
        if (!min && !max) return "-";
        if (min && max) return `${currency}${min}-${currency}${max}/${frequency}`;
        return `${currency}${min || max}/${frequency}`;
      },
      step: "details",
    },
    {
      label: "Skills",
      getValue: (d) => `${d.skills.length} skills`,
      step: "skills",
    },
  ],
  right: [
    {
      label: "Location",
      getValue: (d) => d.location.name || "-",
      step: "details",
    },
    {
      label: "Experience Level",
      getValue: (d) => d.experienceLevel || "-",
      step: "details",
    },
    {
      label: "Requirements",
      getValue: (d) =>
        d.requirements.description ? "Provided" : "-",
      step: "requirements",
    },
    {
      label: "Pre-screening Questions",
      getValue: (d) =>
        `${d.preScreeningQuestions.length} questions`,
      step: "questions",
    },
  ],
};