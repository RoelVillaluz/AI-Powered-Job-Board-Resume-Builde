import type { Skill, WorkExperience, Certification, SocialMedia } from "../models/resume";
import type { Company } from "../models/company";

export type StepName = 'role' | 'details' | 'skills' | 'workExperience' | 'resume' | 'industry' | 'finished';

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