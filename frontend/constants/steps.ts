import type { StepConfig } from "../types/forms/getStartedForm.types";

// Shared role selection step
export const ROLE_SELECTION_STEP: StepConfig = {
    role: null,
    key: "role",
    icon: "fa-solid fa-user-tie",
    title: "Choose your role.",
    description: "Pick job seeker or employer to customize your experience.",
};

export const JOBSEEKER_STEPS: StepConfig[] = [
    ROLE_SELECTION_STEP,
    {
        role: "jobseeker",
        key: "details",
        icon: "fa-solid fa-address-book",
        title: "Add details.",
        description: "Fill in your info to generate your resume.",
    },
    {
        role: "jobseeker",
        key: "skills",
        icon: "fa-solid fa-lightbulb",
        title: "Skills",
        description: "Add skills to boost your resume and get job matches.",
    },
    {
        role: "jobseeker",
        key: "workExperience",
        icon: "fa-solid fa-briefcase",
        title: "Add work experience",
        description: "Mention your previous roles, responsibilities, and achievements to strengthen your resume.",
    },
    {
        role: "jobseeker",
        key: "resume",
        icon: "fa-solid fa-file-invoice",
        title: "Pick a resume template",
        description: "Choose a template, and we'll populate it for you.",
    },
    {
        role: "jobseeker",
        key: "finished",
        icon: "fa-solid fa-check",
        title: "Welcome!",
        description: "You're ready! Start your journey.",
    },
];

export const EMPLOYER_STEPS: StepConfig[] = [
    ROLE_SELECTION_STEP,
    {
        role: "employer",
        key: "details",
        icon: "fa-solid fa-address-book",
        title: "Add details.",
        description: "Provide the details of your company.",
    },
    {
        role: "employer",
        key: "industry",
        icon: "fa-solid fa-industry",
        title: "Select Industry",
        description: "Choose the industry that best fits your company.",
    },
    {
        role: "employer",
        key: "finished",
        icon: "fa-solid fa-check",
        title: "Welcome!",
        description: "You're ready! Start your journey.",
    },
];