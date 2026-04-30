import { Factory } from './builders';
import { createAuthenticatedJobseeker } from '../helpers/authHelper.js';

/**
 * Compound seeders for creating fully wired, DB-persisted entity graphs.
 *
 * Use seeders in integration tests instead of manually chaining Factory calls.
 * Each seeder returns a plain object containing all created documents,
 * so tests can immediately access any entity without extra queries.
 *
 * @module seeders
 *
 * @example
 * // Instead of this in every test file:
 * const employer = await Factory('user').as('employer').for(User).create();
 * const company  = await Factory('company').with({ user: employer._id }).for(Company).create();
 * const job      = await Factory('job').with({ company: company._id }).for(JobPosting).create();
 *
 * // Do this:
 * const { employer, company, job } = await seedJobWithCompany(User, Company, JobPosting);
 */

/**
 * Creates an employer user and a company owned by that employer.
 *
 * @param {mongoose.Model} User
 * @param {mongoose.Model} Company
 * @returns {Promise<{ employer: Document, company: Document }>}
 *
 * @example
 * const { employer, company } = await seedEmployerWithCompany(User, Company);
 */
export const seedEmployerWithCompany = async (User, Company) => {
  const employer = await Factory('user').as('employer').for(User).create();
  const company  = await Factory('company').with({ user: employer._id }).for(Company).create();
  return { employer, company };
};

/**
 * Creates an employer, a company, and one active job posting under that company.
 *
 * @param {mongoose.Model} User
 * @param {mongoose.Model} Company
 * @param {mongoose.Model} JobPosting
 * @returns {Promise<{ employer: Document, company: Document, job: Document }>}
 *
 * @example
 * const { company, job } = await seedJobWithCompany(User, Company, JobPosting);
 */
export const seedJobWithCompany = async (User, Company, JobPosting) => {
  const { employer, company } = await seedEmployerWithCompany(User, Company);
  const job = await Factory('job').with({ company: company._id }).for(JobPosting).create();
  return { employer, company, job };
};

/**
 * Creates a jobseeker user, a resume, and optionally resume embeddings and/or a resume score.
 *
 * @param {object} app                          - Express app instance
 * @param {mongoose.Model} User                 - User model
 * @param {mongoose.Model} Resume               - Resume model
 * @param {mongoose.Model|null} ResumeEmbedding - ResumeEmbedding model (required if hasEmbeddings or hasScore)
 * @param {mongoose.Model|null} ResumeScore     - ResumeScore model (required if hasScore)
 * @param {object} [options={}]                 - Seeding options
 * @param {boolean} [options.hasEmbeddings]     - Whether to seed embeddings
 * @param {boolean} [options.hasScore]          - Whether to seed a score (also seeds embeddings)
 *
 * @returns {Promise<{
 *   jobseeker:        Document,
 *   token:            string,
 *   resume:           Document,
 *   resumeEmbeddings: Document | null,
 *   resumeScore:      Document | null
 * }>}
 *
 * @example
 * // Resume only — for testing embedding generation flow
 * const { jobseeker, token, resume } =
 *     await seedJobseekerWithResume(app, User, Resume);
 *
 * // With embeddings — for testing score generation flow
 * const { jobseeker, token, resume, resumeEmbeddings } =
 *     await seedJobseekerWithResume(app, User, Resume, ResumeEmbedding, null, { hasEmbeddings: true });
 *
 * // With embeddings + score — for testing cached score flow
 * const { jobseeker, token, resume, resumeEmbeddings, resumeScore } =
 *     await seedJobseekerWithResume(app, User, Resume, ResumeEmbedding, ResumeScore, { hasScore: true });
 */
export const seedJobseekerWithResume = async (
    app,
    User,
    Resume,
    ResumeEmbedding = null,
    ResumeScore     = null,
    { hasEmbeddings = false, hasScore = false } = {},
) => {
    const { jobseeker, token } = await createAuthenticatedJobseeker(app);

    const resume = await Factory('resume')
        .with({ user: jobseeker._id })
        .for(Resume)
        .create();

    // hasScore implies hasEmbeddings — score requires embeddings to exist
    const shouldSeedEmbeddings = hasEmbeddings || hasScore;

    const resumeEmbeddings = shouldSeedEmbeddings && ResumeEmbedding
        ? await Factory('resumeEmbedding')
            .with({ resume: resume._id })
            .for(ResumeEmbedding)
            .create()
        : null;

    const resumeScore = hasScore && ResumeScore
        ? await Factory('resumeScore')
            .with({ resume: resume._id })
            .for(ResumeScore)
            .create()
        : null;

    return { jobseeker, token, resume, resumeEmbeddings, resumeScore };
};

/**
 * Creates a complete scenario with all core entities.
 * Use this for testing application flows, AI matching, and cross-collection queries.
 *
 * Includes: employer → company → job posting + jobseeker → resume
 *
 * @param {mongoose.Model} User
 * @param {mongoose.Model} Company
 * @param {mongoose.Model} JobPosting
 * @param {mongoose.Model} Resume
 * @returns {Promise<{
 *   employer:  Document,
 *   company:   Document,
 *   job:       Document,
 *   jobseeker: Document,
 *   resume:    Document
 * }>}
 *
 * @example
 * const { job, resume } = await seedFullScenario(User, Company, JobPosting, Resume);
 * // Now test your AI matching layer against job and resume
 */
export const seedFullScenario = async (app, User, Company, JobPosting, Resume) => {
    const { employer, company, job } = await seedJobWithCompany(User, Company, JobPosting);
    const { jobseeker, token, resume } = await seedJobseekerWithResume(app, User, Resume);
    return { employer, company, job, jobseeker, token, resume };
};

// ─── Payload Builders ─────────────────────────────────────────────────────────
// These build request body shapes for API tests — no DB interaction.
// Named `build*` to distinguish from seeders that persist to the DB.

/**
 * Builds the onboarding request payload for a jobseeker.
 * Matches the double-nested shape the frontend sends:
 * { role, data: { role, data: JobseekerFormData } }
 *
 * @param {string|ObjectId} userId
 * @returns {Promise<Object>} Onboarding request body
 *
 * @example
 * const payload = await buildJobseekerOnboardingPayload(user._id);
 * await request(app).post(`/api/users/${user._id}/onboarding`).send(payload);
 */
export const buildJobseekerOnboardingPayload = async (userId) => {
  const resumeData = await Factory('resume').with({ user: userId }).build();
  return {
    role: 'jobseeker',
    data: {
      role: 'jobseeker',
      data: {
        jobTitle:       resumeData.jobTitle,
        firstName:      resumeData.firstName,
        lastName:       resumeData.lastName,
        phone:          resumeData.phone,
        location:       resumeData.location,
        summary:        resumeData.summary,
        skills:         resumeData.skills,
        workExperience: resumeData.workExperience,
        certifications: resumeData.certifications,
        socialMedia:    resumeData.socialMedia,
      }
    }
  };
}

/**
 * Builds the onboarding request payload for an employer.
 * Matches the double-nested shape the frontend sends:
 * { role, data: { role, data: EmployerFormData } }
 *
 * @param {string|ObjectId} userId
 * @returns {Promise<Object>} Onboarding request body
 *
 * @example
 * const payload = await buildEmployerOnboardingPayload(user._id);
 * await request(app).post(`/api/users/${user._id}/onboarding`).send(payload);
 */
export const buildEmployerOnboardingPayload = async (userId) => {
  const companyData = await Factory('company').with({ user: userId }).build();
  return {
    role: 'employer',
    data: {
      role: 'employer',
      data: {
        name:        companyData.name,
        industry:    companyData.industry,
        location:    companyData.location,
        website:     companyData.website,
        size:        companyData.size,
        description: companyData.description,
      }
    }
  };
};