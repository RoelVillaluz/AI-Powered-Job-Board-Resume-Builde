import type { StepConfig } from "../types/forms/getStartedForm.types";

/**
 * Creates an array of step configurations for a specific user role.
 *
 * This helper automatically adds the `role` property to each step, 
 * so you don't need to manually specify it in each step object.
 *
 * @template T - The role type, either 'jobseeker' or 'employer'.
 * @param {T} role - The role for which these steps are defined.
 * @param {Omit<Extract<StepConfig, { role: T }>, 'role'>[]} steps
 *   - An array of step objects without the `role` property. 
 *     Each object must match the structure of a step for the given role.
 * @returns {Extract<StepConfig, { role: T }>[]}
 *   - A fully typed array of step configurations with `role` added.
 *
 * @example
 * const JOBSEEKER_STEPS = createSteps('jobseeker', [
 *   { key: 'role', icon: 'fa-user-tie', title: 'Choose role', description: 'Pick your role.' },
 *   { key: 'details', icon: 'fa-id-card', title: 'Details', description: 'Fill your info.' },
 * ]);
 *
 * const EMPLOYER_STEPS = createSteps('employer', [
 *   { key: 'role', icon: 'fa-briefcase', title: 'Choose role', description: 'Pick your role.' },
 *   { key: 'industry', icon: 'fa-industry', title: 'Industry', description: 'Select industry.' },
 * ]);
 */
function createSteps<T extends StepConfig['role']>(
    role: T,
    steps: Omit<Extract<StepConfig, { role: T }>, 'role'>[]
): Extract<StepConfig, { role: T }>[] {
    return steps.map(step => ({ role, ...step })) as Extract<StepConfig, { role: T }>[];
}

export const JOBSEEKER_STEPS = createSteps("jobseeker", [
  {
    key: "role",
    icon: "fa-solid fa-user-tie",
    title: "Choose your role.",
    description: "Pick job seeker or employer to customize your experience.",
    validate: (formData) => formData.role !== null
  },
  {
    key: "details",
    icon: "fa-solid fa-address-book",
    title: "Add details.",
    description: "Fill in your info to generate your resume.",
    validate: (formData) => {
      const requiredFields = ["firstName", "lastName", "phone", "address", "summary"];
      return requiredFields.every(field => 
        formData[field as keyof typeof formData]?.toString().trim() !== ""
      );
    }
  },
  {
    key: "skills",
    icon: "fa-solid fa-lightbulb",
    title: "Skills",
    description: "Add skills to boost your resume and get job matches.",
    validate: (formData) => (formData.data.skills?.length ?? 0) >= 3
  },
  {
    key: "workExperience",
    icon: "fa-solid fa-briefcase",
    title: "Add work experience",
    description:
      "Mention your previous roles, responsibilities, and achievements to strengthen your resume.",
    validate: () => true
  },
  {
    key: "resume",
    icon: "fa-solid fa-file-invoice",
    title: "Pick a resume template",
    description: "Choose a template, and we'll populate it for you.",
    validate: () => true
  },
  {
    key: "finished",
    icon: "fa-solid fa-check",
    title: "Welcome!",
    description: "You're ready! Start your journey.",
    validate: () => true
  },
]);

export const EMPLOYER_STEPS = createSteps("employer", [
  {
    key: "role",
    icon: "fa-solid fa-user-tie",
    title: "Choose your role.",
    description: "Pick job seeker or employer to customize your experience.",
    validate: (formData) => formData.role !== null
  },
  {
    key: "details",
    icon: "fa-solid fa-address-book",
    title: "Add details.",
    description: "Provide the details of your company.",
    validate: (formData) => {
      const requiredFields = ["name", "location", "description"];
      return requiredFields.every(field => 
        formData[field as keyof typeof formData]?.toString().trim() !== ""
      );
    }
  },
  {
    key: "industry",
    icon: "fa-solid fa-industry",
    title: "Select Industry",
    description: "Choose the industry that best fits your company.",
    validate: (formData) => formData.data.industry.length > 0
  },
  {
    key: "finished",
    icon: "fa-solid fa-check",
    title: "Welcome!",
    description: "You're ready! Start your journey.",
    validate: () => true
  },
]);