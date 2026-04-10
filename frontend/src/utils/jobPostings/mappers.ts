import type { JobPosting } from "../../../../shared/types/jobPostingTypes";
import type { CreateJobFormData } from "../../../types/forms/createJobForm.types";

export function mapJobToFormData(job: JobPosting): CreateJobFormData {
  return {
    title: {
      _id: job.title?._id?.toString() ?? "",
      name: job.title?.name ?? "",
    },
    location: {
      _id: job.location?._id?.toString() ?? "",
      name: job.location?.name ?? "",
    },
    company: job.company?._id?.toString() ?? "",
    jobType: (job.jobType as CreateJobFormData["jobType"]) ?? "Full-Time",
    experienceLevel: (job.experienceLevel as CreateJobFormData["experienceLevel"]) ?? undefined,
    salary: {
      currency: (job.salary?.currency as CreateJobFormData["salary"]["currency"]) ?? "$",
      min: job.salary?.min ?? null,
      max: job.salary?.max ?? null,
      frequency: (job.salary?.frequency as CreateJobFormData["salary"]["frequency"]) ?? "year",
    },
    requirements: {
      description: job.requirements?.description ?? "",
      education: (job.requirements?.education as CreateJobFormData["requirements"]["education"]) ?? undefined,
      yearsOfExperience: job.requirements?.yearsOfExperience ?? undefined,
      certifications: job.requirements?.certifications ?? [],
    },
    skills: (job.skills ?? []).map((s) => ({
      _id: s.skill?._id?.toString() ?? s._id?.toString() ?? "",
      name: s.skillName ?? s.name ?? "",
      requirementLevel: (s.requirementLevel as CreateJobFormData["skills"][number]["requirementLevel"]) ?? undefined,
    })),
    preScreeningQuestions: job.preScreeningQuestions ?? [],
  };
}