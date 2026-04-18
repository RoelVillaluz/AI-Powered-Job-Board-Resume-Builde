export type JobPosting = {
  _id: string;
  title: { _id: string; name: string };
  company: { _id: string; name: string; industry: string[]; logo: string };
  description: string,
  status: string;
  location: { _id: string; name: string };
  experienceLevel: string;
  jobType: string;
  postedAt: string;
  preScreeningQuestions: any[];
  requirements: {
    description: string;
    education: string;
    yearsOfExperience: number;
    certifications: string[];
  };
  salary: {
    currency: string;
    min: number;
    max: number;
    frequency: string;
  };
  skills: any[];
  applicants: any[];
};