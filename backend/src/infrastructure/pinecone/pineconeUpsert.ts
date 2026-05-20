import { getPineconeIndex } from '../../config/pinecone.js';
import { buildResumeVector, buildJobVector } from '../jobs/domains/embedding/vectorComposer.js';
import { ResumeEmbeddingsDocument, JobPostingEmbeddingsDocument } from '../../types/embeddings.types.js';
import logger from '../../utils/logger.js';

// ─── Resume Metadata ──────────────────────────────────────────────────────────

/**
 * Plain, human-readable fields stored alongside the resume's composite vector
 * in Pinecone. These are NOT vectors — they are used for pre-filtering before
 * the vector similarity search runs.
 *
 * Think of these like columns in a SQL WHERE clause:
 * "Find me jobs similar to this resume WHERE location = 'Manila' AND totalExperienceYears >= 3"
 *
 * All values are sourced from the Resume document (not the embedding document).
 * The only exception is `totalExperienceYears`, which comes from
 * ResumeEmbeddingsDocument.metrics — it's a computed value, not a raw field.
 *
 * What to include as metadata:
 * ✅ Fields you want to filter on at query time
 * ✅ Fields the LLM reranker needs for scoring context
 * ❌ Fields that are purely personal (phone, socialMedia) — no filtering value
 * ❌ Fields already encoded in the vector (the vector handles semantic similarity)
 */
export interface ResumePineconeMetadata {
  /** resume.user — used to scope queries to a specific user's resume */
  userId: string;

  /**
   * resume.jobTitle.name — the candidate's target/current job title.
   * Used by the LLM reranker to assess title alignment.
   * Example: "Backend Engineer", "Data Analyst"
   */
  jobTitle: string;

  /**
   * resume.location.name — where the candidate is based.
   * Stored as a plain string. NOT hard-filtered (vector handles
   * semantic proximity) but passed to LLM reranker for context.
   * Example: "Manila", "Cebu City"
   */
  location: string;

  /**
   * resume.skills[].name — all skill names regardless of level.
   * Pinecone supports string array metadata for $in filtering.
   * Example: ["TypeScript", "Node.js", "PostgreSQL"]
   */
  skills: string[];

  /**
   * resume.skills[] filtered to level === 'Advanced' | 'Expert'.
   * Useful for matching against job's requiredSkills without penalizing
   * beginner-level skills that shouldn't count as strong matches.
   * Example: ["TypeScript", "PostgreSQL"]
   */
  strongSkills: string[];

  /**
   * resume.workExperience[].jobTitle — all past job titles the candidate held.
   * Gives the reranker career trajectory context.
   * Example: ["Junior Developer", "Backend Engineer"]
   */
  previousJobTitles: string[];

  /**
   * resume.workExperience[].company — all companies the candidate worked at.
   * Useful for reranker context (industry exposure, company size signals).
   * Example: ["Accenture", "Startup PH"]
   */
  previousCompanies: string[];

  /**
   * resume.certifications[].name — certification names only (not years).
   * Used for matching against job's certification requirements.
   * Example: ["AWS Certified Developer", "Google Cloud Associate"]
   */
  certifications: string[];

  /**
   * resume.predictedSalary — the AI-predicted salary for this candidate.
   * Stored so the reranker can flag salary mismatches against job ranges
   * without fetching from MongoDB.
   * Value is 0 if not yet predicted.
   */
  predictedSalary: number;

  /**
   * resumeEmbedding.metrics.totalExperienceYears — total years of work experience,
   * computed by the Python embedding pipeline from workExperience date ranges.
   * Used as a hard pre-filter: jobs requiring 8 years won't surface for a 2-year candidate.
   */
  totalExperienceYears: number;
}

// ─── Job Metadata ─────────────────────────────────────────────────────────────

/**
 * Plain, human-readable fields stored alongside the job's composite vector
 * in Pinecone. Sourced entirely from the JobPosting document.
 *
 * @see JobPosting schema for field definitions and enums
 */
export interface JobPineconeMetadata {
  /** job.title.name — e.g. "Senior Backend Engineer" */
  title: string;

  /** job.location.name — e.g. "Manila", "Remote" */
  location: string;

  /**
   * job.skills[].name — all skills regardless of requirementLevel.
   * Used by reranker for full skill overlap analysis.
   */
  skills: string[];

  /**
   * job.skills[] filtered to requirementLevel === 'Required'.
   * Missing any of these should heavily penalize the match score.
   */
  requiredSkills: string[];

  /**
   * job.experienceLevel — 'Intern' | 'Entry' | 'Mid-Level' | 'Senior'
   * Pre-filtered with adjacent levels (e.g. Entry candidate sees Entry + Mid-Level jobs).
   */
  experienceLevel: string;

  /**
   * job.jobType — 'Full-Time' | 'Part-Time' | 'Contract' | 'Internship'
   * Hard-filtered when candidate specifies a preference.
   */
  jobType: string;

  /**
   * job.requirements.yearsOfExperience — minimum years required.
   * Pre-filtered with a +1 year tolerance buffer.
   */
  yearsOfExperience: number;

  /** job.salary.min */
  salaryMin: number;

  /** job.salary.max */
  salaryMax: number;

  /** job.salary.currency — '$' | '₱' | '€' | '¥' | '£' */
  salaryCurrency: string;

  /** job.salary.frequency — 'hour' | 'day' | 'week' | 'month' | 'year' */
  salaryFrequency: string;

  /**
   * job.requirements.certifications — certifications the job requires.
   * Matched against resume's certifications field in the reranker.
   */
  requiredCertifications: string[];
}

// ─── Upsert Functions ─────────────────────────────────────────────────────────

/**
 * Builds a composite vector from a resume's field embeddings and upserts it
 * into Pinecone's `resumes` namespace alongside filterable metadata.
 *
 * Call this after saving a ResumeEmbedding document to MongoDB.
 *
 * @param doc     - The saved ResumeEmbeddingsDocument from MongoDB
 * @param metadata - Human-readable fields from the Resume document
 *
 * @example
 * const resume = await Resume.findById(resumeId).lean();
 * const resumeEmbedding = await ResumeEmbedding.findOne({ resume: resumeId }).lean();
 */
export async function upsertResumeVector(
  doc: ResumeEmbeddingsDocument,
  metadata: ResumePineconeMetadata
): Promise<void> {
  const index = getPineconeIndex();
  const vector = buildResumeVector(doc);

  await index.namespace('resumes').upsert({
    records: [{
      id:     doc.resume.toString(),
      values: vector,
      metadata: {
        userId:              metadata.userId,
        jobTitle:            metadata.jobTitle,
        location:            metadata.location,
        skills:              metadata.skills,
        strongSkills:        metadata.strongSkills,
        previousJobTitles:   metadata.previousJobTitles,
        previousCompanies:   metadata.previousCompanies,
        certifications:      metadata.certifications,
        predictedSalary:     metadata.predictedSalary,
        totalExperienceYears: doc.metrics?.totalExperienceYears ?? 0,
        postedAt: Date.now(), // always stamped here, never from caller
      },
    }]
  });

  logger.info(`[Pinecone] Upserted resume vector: ${doc.resume}`);
}

/**
 * Builds a composite vector from a job posting's field embeddings and upserts
 * it into Pinecone's `jobs` namespace alongside filterable metadata.
 *
 * Call this after saving a JobEmbedding document to MongoDB.
 *
 * @param doc      - The saved JobPostingEmbeddingsDocument from MongoDB
 * @param metadata - Human-readable fields from the JobPosting document
 *
 * @example
 * const job = await JobPosting.findById(jobPostingId).lean();
 * const jobEmbedding = await JobEmbedding.findOne({ jobPosting: jobPostingId }).lean();
 *
 */
export async function upsertJobVector(
  doc: JobPostingEmbeddingsDocument,
  metadata: JobPineconeMetadata
): Promise<void> {
  const index = getPineconeIndex();
  const vector = buildJobVector(doc);

  await index.namespace('jobs').upsert({
    records: [{
      id:     doc.jobPosting.toString(),
      values: vector,
      metadata: {
        title:                  metadata.title,
        location:               metadata.location,
        skills:                 metadata.skills,
        requiredSkills:         metadata.requiredSkills,
        experienceLevel:        metadata.experienceLevel        ?? '',
        jobType:                metadata.jobType,
        yearsOfExperience:      metadata.yearsOfExperience      ?? 0,
        salaryMin:              metadata.salaryMin              ?? 0,
        salaryMax:              metadata.salaryMax              ?? 0,
        salaryCurrency:         metadata.salaryCurrency         ?? '$',
        salaryFrequency:        metadata.salaryFrequency        ?? 'year',
        requiredCertifications: metadata.requiredCertifications ?? [],
        postedAt:               Date.now(),
      },
    }]
  });

  logger.info(`[Pinecone] Upserted job vector: ${doc.jobPosting}`);
}

// ─── Delete Functions ─────────────────────────────────────────────────────────

/**
 * Removes a resume vector from Pinecone.
 * Call this when a Resume document is deleted from MongoDB.
 *
 * @param resumeId - The MongoDB ObjectId string of the resume
 */
export async function deleteResumeVector(resumeId: string): Promise<void> {
  await getPineconeIndex().namespace('resumes').deleteOne({ id: resumeId });
  logger.info(`[Pinecone] Deleted resume vector: ${resumeId}`);
}

/**
 * Removes a job posting vector from Pinecone.
 * Call this when a JobPosting document is deleted from MongoDB
 * or its status changes to 'Closed' or 'Archived'.
 *
 * @param jobId - The MongoDB ObjectId string of the job posting
 */
export async function deleteJobVector(jobId: string): Promise<void> {
  await getPineconeIndex().namespace('jobs').deleteOne({ id: jobId });
  logger.info(`[Pinecone] Deleted job vector: ${jobId}`);
}