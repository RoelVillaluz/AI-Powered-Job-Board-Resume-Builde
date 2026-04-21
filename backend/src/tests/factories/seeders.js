import { Factory } from './builders';

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
 * Creates a jobseeker user and a resume owned by that jobseeker.
 *
 * @param {mongoose.Model} User
 * @param {mongoose.Model} Resume
 * @returns {Promise<{ jobseeker: Document, resume: Document }>}
 *
 * @example
 * const { jobseeker, resume } = await seedJobseekerWithResume(User, Resume);
 */
export const seedJobseekerWithResume = async (User, Resume) => {
  const jobseeker = await Factory('user').for(User).create();
  const resume    = await Factory('resume').with({ user: jobseeker._id }).for(Resume).create();
  return { jobseeker, resume };
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
export const seedFullScenario = async (User, Company, JobPosting, Resume) => {
  const { employer, company, job } = await seedJobWithCompany(User, Company, JobPosting);
  const { jobseeker, resume }      = await seedJobseekerWithResume(User, Resume);
  return { employer, company, job, jobseeker, resume };
};