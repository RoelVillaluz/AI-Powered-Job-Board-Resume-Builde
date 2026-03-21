export interface Skill {
    name: string;
    level?: string; 
    _id?: string;   
}

export interface WorkExperience {
    jobTitle: string;
    company: string;
    startDate: Date | string;
    endDate?: Date | string;
    responsibilities: string[];
}

export interface Certification {
    name: string;
    year: string;
}

export interface SocialMedia {
    facebook?: string | null;
    linkedIn?: string | null;
    github?: string | null;
    website?: string | null;
}

export interface Resume {
    _id: string;
    user: string;
    firstName: string;
    lastName: string;
    phone: string;
    address: string;
    summary: string;
    skills: Skill[];
    workExperience: WorkExperience[];
    certifications: Certification[];
    socialMedia: SocialMedia;
    score: number;
    predictedSalary: number;
    createdAt: Date | string;
    [key: string]: any; // allow extra fields if needed
}