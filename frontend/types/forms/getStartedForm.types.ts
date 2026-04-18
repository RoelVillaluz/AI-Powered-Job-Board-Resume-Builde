import type { Skill, WorkExperience, Certification, SocialMedia } from "../models/resume";
import { FormJobTitle, FormLocation } from "./createJobForm.types";

export type UserRole = 'jobseeker' | 'employer' | null;

export type JobseekerStepKey =
  | 'role'
  | 'details'
  | 'skills'
  | 'workExperience'
  | 'resume'
  | 'finished';

export type EmployerStepKey =
  | 'role'
  | 'details'
  | 'industry'
  | 'finished';


export type JobseekerFormData = {
    user: string | null;
    jobTitle: FormJobTitle;
    firstName: string;
    lastName: string;
    phone: string;
    location: FormLocation;
    summary: string;
    skills: Skill[];
    workExperience: WorkExperience[];
    certifications: Certification[];
    socialMedia: SocialMedia;
};

export type EmployerFormData = {
    user: string | null;
    name: string;
    industry: string[];
    location: FormLocation;
    website: string;
    size: string;
    description: string;
    logo: string;
}

export type GetStartedFormData =
    | {
        role: "jobseeker";
        data: JobseekerFormData;
        }
    | {
        role: "employer";
        data: EmployerFormData;
        };

// Simplified StepConfig - no validate function tied to formData
export type StepConfig = {
    role: 'jobseeker' | 'employer' | null; // null for the role selection step
    key: JobseekerStepKey | EmployerStepKey;
    icon: string;
    title: string;
    description: string;
};