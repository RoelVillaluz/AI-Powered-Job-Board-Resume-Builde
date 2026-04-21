import { registry } from '../registry';

/**
 * Ref factory definitions for embedded sub-documents shared across collections.
 *
 * These factories produce the `{ _id, name }` shape used in:
 * - JobPosting:  title, location, skills
 * - Resume:      jobTitle, location, skills
 * - Company:     location
 *
 * Every call to registry.build() generates a fresh ObjectId for `_id`.
 * If two documents need to reference the SAME entity (e.g. for AI matching tests),
 * build the ref once and spread it into both:
 *
 * @example
 * const jsSkill = await registry.build('skillRef', { name: 'JavaScript' });
 *
 * const job    = await Factory('job')
 *   .with({ skills: [{ ...jsSkill, requirementLevel: 'Required' }] })
 *   .for(JobPosting).create();
 *
 * const resume = await Factory('resume')
 *   .with({ skills: [{ ...jsSkill, level: 'Advanced' }] })
 *   .for(Resume).create();
 *
 * // job.skills[0]._id === resume.skills[0]._id ✅
 */

// ─── JobTitle ─────────────────────────────────────────────────────────────────

/**
 * Produces a JobTitle embedded ref: { _id: ObjectId, name: string }
 * Referenced by JobPosting.title and Resume.jobTitle.
 *
 * @factory jobTitleRef
 * @traits fullStack | designer | dataScience
 */
registry.define('jobTitleRef', {
  defaults: (r) => ({
    _id:  r.newId(),
    name: 'Software Engineer',
  }),
  traits: {
    fullStack:   () => ({ name: 'Full Stack Developer' }),
    designer:    () => ({ name: 'UI/UX Designer' }),
    dataScience: () => ({ name: 'Data Scientist' }),
  },
});

// ─── Location ─────────────────────────────────────────────────────────────────

/**
 * Produces a Location embedded ref: { _id: ObjectId, name: string }
 * Referenced by JobPosting.location, Resume.location, and Company.location.
 *
 * @factory locationRef
 * @traits remote | manila | newYork
 */
registry.define('locationRef', {
  defaults: (r) => ({
    _id:  r.newId(),
    name: 'San Francisco, CA',
  }),
  traits: {
    remote:  () => ({ name: 'Remote' }),
    manila:  () => ({ name: 'Manila, PH' }),
    newYork: () => ({ name: 'New York, NY' }),
  },
});

// ─── Skill ────────────────────────────────────────────────────────────────────

/**
 * Produces a Skill embedded ref: { _id: ObjectId, name: string }
 * Referenced by JobPosting.skills and Resume.skills.
 *
 * Note: skill-specific fields like `requirementLevel` (job) and `level` (resume)
 * are NOT included here — pass them as overrides at the call site since they
 * differ per collection.
 *
 * @factory skillRef
 * @traits nodeJs | mongodb | react | python
 *
 * @example
 * // Job usage
 * registry.build('skillRef', { name: 'JavaScript', requirementLevel: 'Required' })
 *
 * // Resume usage
 * registry.build('skillRef', { name: 'JavaScript', level: 'Advanced' })
 */
registry.define('skillRef', {
  defaults: (r) => ({
    _id:  r.newId(),
    name: 'JavaScript',
  }),
  traits: {
    nodeJs:  () => ({ name: 'Node.js' }),
    mongodb: () => ({ name: 'MongoDB' }),
    react:   () => ({ name: 'React' }),
    python:  () => ({ name: 'Python' }),
  },
});