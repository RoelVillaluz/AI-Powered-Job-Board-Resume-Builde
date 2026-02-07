import type { Skill, WorkExperience, Certification, SocialMedia } from "../models/resume";

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
    user: { id: string } | null;
    firstName: string;
    lastName: string;
    phone: string;
    address: string;
    summary: string;
    skills: Skill[];
    workExperience: WorkExperience[];
    certifications: Certification[];
    socialMedia: SocialMedia;
};

export type EmployerFormData = {
    user: { id: string } | null;
    name: string;
    industry: string[];
    location: string;
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

export type StepConfig =
  | {
      role: 'jobseeker';
      key: JobseekerStepKey;
      icon: string;
      title: string;
      description: string;
      validate?: (formData: Extract<GetStartedFormData, { role: 'jobseeker' }>) => boolean;
    }
  | {
      role: 'employer';
      key: EmployerStepKey;
      icon: string;
      title: string;
      description: string;
      validate?: (formData: Extract<GetStartedFormData, { role: 'employer' }>) => boolean;
    };